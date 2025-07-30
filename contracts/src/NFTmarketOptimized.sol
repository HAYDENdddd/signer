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

contract NFTMarketOptimized is ITokenReceiver, Ownable, EIP712 {
    // 优化后的上架信息结构体 - 打包到两个存储槽
    struct Listing {
        address seller;     // 20 bytes
        uint96 price;      // 12 bytes - 足够存储价格 (最大约 79 billion tokens)
        bool active;       // 1 byte
        // 第一个槽: seller(20) + price(12) = 32 bytes
        // 第二个槽: active(1) + padding(31) = 32 bytes
    }

    // 进一步优化 - 将所有信息打包到一个槽
    struct OptimizedListing {
        address seller;     // 20 bytes
        uint96 price;      // 12 bytes
        // 总共32字节，完美填满一个存储槽
        // active状态通过price > 0来判断，节省存储
    }

    // 白名单管理优化 - 使用打包结构
    struct WhitelistData {
        uint128 count;          // 白名单数量 - 16 bytes
        uint128 maxSize;        // 最大白名单大小 - 16 bytes
        // 一个存储槽: count(16) + maxSize(16) = 32 bytes
    }

    // EIP-712 类型哈希
    bytes32 private constant PERMIT_BUY_TYPEHASH =
        keccak256(
            "PermitBuy(address buyer,uint256 tokenId,uint256 deadline)"
        );

    // 状态变量优化
    WhitelistData public whitelistData;                    // 白名单元数据
    mapping(address => bool) public whitelist;             // 白名单映射
    address[] public whitelistArray;                       // 白名单数组
    IMyNFT public nftContract;                             // NFT合约
    HTT public tokenContract;                              // Token合约
    mapping(uint256 => OptimizedListing) public listings;  // 优化后的上架映射

    // 事件定义
    event NFTListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    event NFTSold(
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price
    );

    // 构造函数
    constructor(
        address _nftContract,
        address _tokenContract
    ) Ownable(msg.sender) EIP712("NFTMarketOptimized", "1") {
        nftContract = IMyNFT(_nftContract);
        tokenContract = HTT(_tokenContract);
        whitelistData = WhitelistData({
            count: 0,
            maxSize: 1000  // 设置最大白名单大小
        });
    }

    // 优化的白名单管理函数
    function addWhitelist(address _whitelist) external onlyOwner {
        require(_whitelist != address(0), "Invalid whitelist address");
        require(!whitelist[_whitelist], "Address already whitelisted");
        require(whitelistData.count < whitelistData.maxSize, "Whitelist full");
        
        whitelist[_whitelist] = true;
        whitelistArray.push(_whitelist);
        
        // 原子性更新计数
        whitelistData.count++;
    }

    function removeWhitelist(address _whitelist) external onlyOwner {
        require(whitelist[_whitelist], "Address not whitelisted");
        whitelist[_whitelist] = false;
        
        // 优化的数组移除 - 使用swap and pop
        uint256 length = whitelistArray.length;
        for (uint256 i = 0; i < length; i++) {
            if (whitelistArray[i] == _whitelist) {
                whitelistArray[i] = whitelistArray[length - 1];
                whitelistArray.pop();
                break;
            }
        }
        
        whitelistData.count--;
    }

    // 批量操作优化
    function addWhitelistBatch(address[] calldata _whitelists) external onlyOwner {
        uint256 newCount = whitelistData.count + _whitelists.length;
        require(newCount <= whitelistData.maxSize, "Batch exceeds whitelist limit");
        
        for (uint256 i = 0; i < _whitelists.length; i++) {
            address addr = _whitelists[i];
            require(addr != address(0), "Invalid whitelist address");
            if (!whitelist[addr]) {
                whitelist[addr] = true;
                whitelistArray.push(addr);
            }
        }
        
        whitelistData.count = uint128(newCount);
    }

    function removeWhitelistBatch(address[] calldata _whitelists) external onlyOwner {
        for (uint256 i = 0; i < _whitelists.length; i++) {
            address addr = _whitelists[i];
            if (whitelist[addr]) {
                whitelist[addr] = false;
                
                // 优化的移除逻辑
                uint256 length = whitelistArray.length;
                for (uint256 j = 0; j < length; j++) {
                    if (whitelistArray[j] == addr) {
                        whitelistArray[j] = whitelistArray[length - 1];
                        whitelistArray.pop();
                        whitelistData.count--;
                        break;
                    }
                }
            }
        }
    }

    function isWhitelisted(address _address) external view returns (bool) {
        return whitelist[_address];
    }

    function getWhitelistAddresses() external view returns (address[] memory) {
        return whitelistArray;
    }

    function getWhitelistCount() external view returns (uint256) {
        return whitelistData.count;
    }

    // 优化的上架函数
    function list(uint256 tokenId, uint256 price) external {
        require(price > 0 && price <= type(uint96).max, "Invalid price range");
        require(
            nftContract.ownerOf(tokenId) == msg.sender,
            "Not the owner of this NFT"
        );
        require(
            nftContract.getApproved(tokenId) == address(this) ||
                nftContract.isApprovedForAll(msg.sender, address(this)),
            "NFT not approved for marketplace"
        );
        
        // 使用优化的结构体，一次写入
        listings[tokenId] = OptimizedListing({
            seller: msg.sender,
            price: uint96(price)
        });
        
        emit NFTListed(tokenId, msg.sender, price);
    }

    // 优化的购买函数
    function buyNFT(uint256 tokenId) external {
        OptimizedListing memory listing = listings[tokenId];
        require(listing.price > 0, "NFT not listed for sale"); // price > 0 表示active
        require(listing.seller != msg.sender, "Cannot buy your own NFT");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // 清除上架信息（设置price为0表示inactive）
        delete listings[tokenId];
        
        require(
            tokenContract.transferFrom(msg.sender, seller, price),
            "Token transfer failed"
        );
        nftContract.safeTransferFrom(seller, msg.sender, tokenId);
        
        emit NFTSold(tokenId, seller, msg.sender, price);
    }

    // 优化的代币接收函数
    function tokensReceived(
        address from,
        uint256 amount,
        bytes calldata data
    ) external override {
        require(
            msg.sender == address(tokenContract),
            "Only token contract can call"
        );
        
        uint256 tokenId = abi.decode(data, (uint256));
        OptimizedListing memory listing = listings[tokenId];
        require(listing.price > 0, "NFT not listed for sale");
        require(listing.seller != from, "Cannot buy your own NFT");
        require(amount >= listing.price, "Insufficient token amount");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // 清除上架信息
        delete listings[tokenId];
        
        // 处理退款和支付
        if (amount > price) {
            require(
                tokenContract.transfer(from, amount - price),
                "Refund transfer failed"
            );
        }
        require(
            tokenContract.transfer(seller, price),
            "Payment transfer failed"
        );
        
        nftContract.safeTransferFrom(seller, from, tokenId);
        emit NFTSold(tokenId, seller, from, price);
    }

    // 优化的签名购买函数
    function permitBuy(
        uint256 tokenId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(deadline >= block.timestamp, "PERMIT_DEADLINE_EXPIRED");
        require(whitelist[msg.sender], "Buyer not whitelisted");

        // 验证签名
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_BUY_TYPEHASH,
                msg.sender,
                tokenId,
                deadline
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, v, r, s);
        require(signer != address(0), "Invalid signature");
        require(signer == owner(), "Signature must be from contract owner");

        // 执行购买
        OptimizedListing memory listing = listings[tokenId];
        require(listing.price > 0, "NFT not listed for sale");
        require(listing.seller != msg.sender, "Cannot buy your own NFT");

        address seller = listing.seller;
        uint256 listingPrice = listing.price;
        
        delete listings[tokenId];

        require(
            tokenContract.transferFrom(msg.sender, seller, listingPrice),
            "Token transfer failed"
        );
        nftContract.safeTransferFrom(seller, msg.sender, tokenId);
        
        emit NFTSold(tokenId, seller, msg.sender, listingPrice);
    }

    // 查询函数
    function getListing(
        uint256 tokenId
    ) external view returns (address seller, uint256 price, bool active) {
        OptimizedListing memory listing = listings[tokenId];
        return (listing.seller, listing.price, listing.price > 0);
    }

    // 优化的获取所有上架列表函数
    function getAllListings()
        external
        view
        returns (
            uint256[] memory tokenIds,
            address[] memory sellers,
            uint256[] memory prices
        )
    {
        // 使用更高效的方法 - 限制扫描范围
        uint256 maxTokenId = 100; // 减少扫描范围以降低gas消耗
        uint256[] memory tempTokenIds = new uint256[](maxTokenId);
        address[] memory tempSellers = new address[](maxTokenId);
        uint256[] memory tempPrices = new uint256[](maxTokenId);
        
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= maxTokenId; i++) {
            OptimizedListing memory listing = listings[i];
            if (listing.price > 0) {
                tempTokenIds[activeCount] = i;
                tempSellers[activeCount] = listing.seller;
                tempPrices[activeCount] = listing.price;
                activeCount++;
            }
        }
        
        // 创建精确大小的数组
        tokenIds = new uint256[](activeCount);
        sellers = new address[](activeCount);
        prices = new uint256[](activeCount);
        
        for (uint256 i = 0; i < activeCount; i++) {
            tokenIds[i] = tempTokenIds[i];
            sellers[i] = tempSellers[i];
            prices[i] = tempPrices[i];
        }
        
        return (tokenIds, sellers, prices);
    }
}