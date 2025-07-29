// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./HTToken.sol";

// 定义接口
interface ITokenReceiver {
    function tokensReceived(
        address from,
        uint256 amount,
        bytes calldata data
    ) external;
}

interface IMyNFT is IERC721 {
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}

// HTT合约已经继承了ERC20，直接使用即可

contract NFTMarket is ITokenReceiver, Ownable, EIP712 {
    // 上架信息结构体，记录卖家、价格、是否在售
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    // EIP-712 类型哈希
    bytes32 private constant PERMIT_BUY_TYPEHASH =
        keccak256(
            "PermitBuy(address buyer,uint256 tokenId,uint256 price,uint256 deadline)"
        );

    mapping(address => bool) public whitelist; // 白名单地址映射
    address[] public whitelistArray; // 白名单地址数组，用于遍历
    IMyNFT public nftContract; // NFT合约实例
    HTT public tokenContract; // HTToken合约实例
    mapping(uint256 => Listing) public listings; // tokenId => 上架信息

    // 上架事件，便于测试断言和前端监听
    event NFTListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    // 购买事件，便于测试断言和前端监听
    event NFTSold(
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price
    );

    // 构造函数，初始化NFT和ERC20合约地址
    constructor(
        address _nftContract,
        address _tokenContract
    ) Ownable(msg.sender) EIP712("NFTMarket", "1") {
        nftContract = IMyNFT(_nftContract);
        tokenContract = HTT(_tokenContract);
    }

    // 添加白名单地址（仅限owner）
    function addWhitelist(address _whitelist) external onlyOwner {
        require(_whitelist != address(0), "Invalid whitelist address");
        require(!whitelist[_whitelist], "Address already whitelisted");
        whitelist[_whitelist] = true;
        whitelistArray.push(_whitelist);
    }

    // 移除白名单地址（仅限owner）
    function removeWhitelist(address _whitelist) external onlyOwner {
        require(whitelist[_whitelist], "Address not whitelisted");
        whitelist[_whitelist] = false;
        
        // 从数组中移除
        for (uint256 i = 0; i < whitelistArray.length; i++) {
            if (whitelistArray[i] == _whitelist) {
                whitelistArray[i] = whitelistArray[whitelistArray.length - 1];
                whitelistArray.pop();
                break;
            }
        }
    }

    // 批量设置白名单地址（仅限owner）
    function setWhitelistBatch(address[] calldata _whitelists) external onlyOwner {
        // 清空现有白名单
        for (uint256 i = 0; i < whitelistArray.length; i++) {
            whitelist[whitelistArray[i]] = false;
        }
        delete whitelistArray;
        
        // 添加新的白名单
        for (uint256 i = 0; i < _whitelists.length; i++) {
            require(_whitelists[i] != address(0), "Invalid whitelist address");
            require(!whitelist[_whitelists[i]], "Duplicate address in batch");
            whitelist[_whitelists[i]] = true;
            whitelistArray.push(_whitelists[i]);
        }
    }

    // 检查地址是否在白名单中
    function isWhitelisted(address _address) external view returns (bool) {
        return whitelist[_address];
    }

    // 获取所有白名单地址
    function getWhitelistAddresses() external view returns (address[] memory) {
        return whitelistArray;
    }

    // 上架NFT，支持任意ERC20价格
    function list(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than 0"); // 校验价格
        require(
            nftContract.ownerOf(tokenId) == msg.sender,
            "Not the owner of this NFT"
        ); // 校验NFT归属权
        require(
            nftContract.getApproved(tokenId) == address(this) ||
                nftContract.isApprovedForAll(msg.sender, address(this)),
            "NFT not approved for marketplace"
        ); // 校验授权（单个或批量）
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        }); // 存储上架信息
        emit NFTListed(tokenId, msg.sender, price); // 触发上架事件
    }

    // 购买NFT（传统ERC20支付方式）
    function buyNFT(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "NFT not listed for sale"); // 校验在售
        require(listing.seller != msg.sender, "Cannot buy your own NFT"); // 校验不能自购
        uint256 price = listing.price;
        address seller = listing.seller;
        listing.active = false; // 下架
        require(
            tokenContract.transferFrom(msg.sender, seller, price),
            "Token transfer failed"
        ); // 买家支付ERC20给卖家
        nftContract.safeTransferFrom(seller, msg.sender, tokenId); // NFT转移
        emit NFTSold(tokenId, seller, msg.sender, price); // 触发购买事件
    }

    // 购买NFT（ERC20回调方式，支持超额退款）
    function tokensReceived(
        address from,
        uint256 amount,
        bytes calldata data
    ) external override {
        require(
            msg.sender == address(tokenContract),
            "Only token contract can call"
        ); // 只能由ERC20合约回调
        uint256 tokenId = abi.decode(data, (uint256));
        Listing storage listing = listings[tokenId];
        require(listing.active, "NFT not listed for sale"); // 校验在售
        require(listing.seller != from, "Cannot buy your own NFT"); // 校验不能自购
        require(amount >= listing.price, "Insufficient token amount"); // 校验金额
        address seller = listing.seller;
        uint256 price = listing.price;
        listing.active = false; // 下架
        if (amount > price) {
            require(
                tokenContract.transfer(from, amount - price),
                "Refund transfer failed"
            ); // 超额退款
        }
        require(
            tokenContract.transfer(seller, price),
            "Payment transfer failed"
        ); // 支付给卖家
        nftContract.safeTransferFrom(seller, from, tokenId); // NFT转移
        emit NFTSold(tokenId, seller, from, price); // 触发购买事件
    }

    // 通过离线授权购买NFT
    function permitBuy(
        uint256 tokenId,
        uint256 price,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(price > 0, "Price must be greater than 0");
        require(deadline >= block.timestamp, "PERMIT_DEADLINE_EXPIRED");
        require(whitelist != address(0), "Whitelist not set");

        // 验证 EIP-712 签名
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_BUY_TYPEHASH,
                msg.sender, // buyer地址
                tokenId,
                price,
                deadline
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, v, r, s);
        require(signer != address(0), "Invalid signature");
        require(signer == whitelist, "Not whitelisted signer");

        // 执行购买逻辑
        Listing storage listing = listings[tokenId];
        require(listing.active, "NFT not listed for sale");
        require(listing.seller != msg.sender, "Cannot buy your own NFT");
        require(price >= listing.price, "Price too low");

        address seller = listing.seller;
        uint256 listingPrice = listing.price;
        listing.active = false; // 下架

        // 转移代币支付
        require(
            tokenContract.transferFrom(msg.sender, seller, listingPrice),
            "Token transfer failed"
        );

        // 转移NFT
        nftContract.safeTransferFrom(seller, msg.sender, tokenId);

        // 触发购买事件
        emit NFTSold(tokenId, seller, msg.sender, listingPrice);
    }

    // 查询上架信息，便于测试和前端查询
    function getListing(
        uint256 tokenId
    ) external view returns (address seller, uint256 price, bool active) {
        Listing memory listing = listings[tokenId];
        return (listing.seller, listing.price, listing.active);
    }

    // 获取所有上架的NFT列表
    function getAllListings()
        external
        view
        returns (
            uint256[] memory tokenIds,
            address[] memory sellers,
            uint256[] memory prices,
            bool[] memory actives
        )
    {
        // 首先计算活跃的listing数量
        uint256 activeCount = 0;
        uint256 maxTokenId = 1000; // 假设最大tokenId为1000，实际应该从NFT合约获取

        for (uint256 i = 1; i <= maxTokenId; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }

        // 创建数组
        tokenIds = new uint256[](activeCount);
        sellers = new address[](activeCount);
        prices = new uint256[](activeCount);
        actives = new bool[](activeCount);

        // 填充数组
        uint256 index = 0;
        for (uint256 i = 1; i <= maxTokenId; i++) {
            if (listings[i].active) {
                tokenIds[index] = i;
                sellers[index] = listings[i].seller;
                prices[index] = listings[i].price;
                actives[index] = listings[i].active;
                index++;
            }
        }

        return (tokenIds, sellers, prices, actives);
    }
}
