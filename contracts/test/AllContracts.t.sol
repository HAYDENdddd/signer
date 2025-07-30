// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {HTT} from "../src/HTToken.sol";
import {MyNFT} from "../src/MyNFT.sol";
import {NFTMarketOptimized} from "../src/NFTmarketOptimized.sol";
import {TokenBank} from "../src/TokenBank.sol";

contract AllContractsTest is Test {
    HTT public htToken;
    MyNFT public myNFT;
    NFTMarketOptimized public nftMarket;
    TokenBank public tokenBank;
    
    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public whitelistSigner = address(0x3);
    
    function setUp() public {
        // 部署 HTToken
        htToken = new HTT();
        
        // 部署 MyNFT
        myNFT = new MyNFT();
        
        // 部署 NFTmarket
        nftMarket = new NFTMarketOptimized(address(myNFT), address(htToken));
        
        // 部署 TokenBank
        tokenBank = new TokenBank(address(htToken));
        
        // 给用户分配一些代币
        htToken.transfer(user1, 10000 * 10**18);
        htToken.transfer(user2, 10000 * 10**18);
        
        // 添加白名单签名者
        nftMarket.addWhitelist(whitelistSigner);
    }
    
    function testHTTokenBasics() public {
        assertEq(htToken.name(), "HTToken");
        assertEq(htToken.symbol(), "HTT");
        assertEq(htToken.totalSupply(), 1000000 * 10**18);
        assertEq(htToken.balanceOf(user1), 10000 * 10**18);
    }
    
    function testHTTokenTransfer() public {
        vm.prank(user1);
        htToken.transfer(user2, 1000 * 10**18);
        
        assertEq(htToken.balanceOf(user1), 9000 * 10**18);
        assertEq(htToken.balanceOf(user2), 11000 * 10**18);
    }
    
    function testMyNFTMinting() public {
        // 测试 safeMint
        myNFT.safeMint(user1, "https://example.com/token/1");
        assertEq(myNFT.ownerOf(1), user1);
        assertEq(myNFT.tokenURI(1), "https://example.com/token/1");
        assertEq(myNFT.getCurrentTokenId(), 2);
        
        // 测试 adminMint
        myNFT.adminMint(user2, "https://example.com/token/2");
        assertEq(myNFT.ownerOf(2), user2);
        assertEq(myNFT.getCurrentTokenId(), 3);
    }
    
    function testNFTMarketListing() public {
        // 先铸造一个 NFT
        myNFT.safeMint(user1, "https://example.com/token/1");
        
        // 用户1授权市场合约
        vm.prank(user1);
        myNFT.approve(address(nftMarket), 1);
        
        // 用户1上架 NFT
        vm.prank(user1);
        nftMarket.list(1, 1000 * 10**18);
        
        // 检查上架信息
        (address seller, uint256 price, bool active) = nftMarket.getListing(1);
        assertEq(seller, user1);
        assertEq(price, 1000 * 10**18);
        assertTrue(active);
    }
    
    function testNFTMarketBuying() public {
        // 先铸造和上架 NFT
        myNFT.safeMint(user1, "https://example.com/token/1");
        
        vm.prank(user1);
        myNFT.approve(address(nftMarket), 1);
        
        vm.prank(user1);
        nftMarket.list(1, 1000 * 10**18);
        
        // 用户2授权代币给市场合约
        vm.prank(user2);
        htToken.approve(address(nftMarket), 1000 * 10**18);
        
        // 用户2购买 NFT
        vm.prank(user2);
        nftMarket.buyNFT(1);
        
        // 检查所有权转移
        assertEq(myNFT.ownerOf(1), user2);
        
        // 检查代币转移
        assertEq(htToken.balanceOf(user1), 11000 * 10**18); // 10000 + 1000
        assertEq(htToken.balanceOf(user2), 9000 * 10**18);  // 10000 - 1000
        
        // 检查上架状态
        (, , bool active) = nftMarket.getListing(1);
        assertFalse(active);
    }
    
    function testTokenBankDeposit() public {
        // 用户1授权代币给银行合约
        vm.prank(user1);
        htToken.approve(address(tokenBank), 5000 * 10**18);
        
        // 用户1存款
        vm.prank(user1);
        tokenBank.deposit(5000 * 10**18);
        
        // 检查余额
        assertEq(tokenBank.balances(user1), 5000 * 10**18);
        assertEq(htToken.balanceOf(user1), 5000 * 10**18);
        assertEq(htToken.balanceOf(address(tokenBank)), 5000 * 10**18);
    }
    
    function testTokenBankWithdraw() public {
        // 先存款
        vm.prank(user1);
        htToken.approve(address(tokenBank), 5000 * 10**18);
        
        vm.prank(user1);
        tokenBank.deposit(5000 * 10**18);
        
        // 取款
        vm.prank(user1);
        tokenBank.withdraw(2000 * 10**18);
        
        // 检查余额
        assertEq(tokenBank.balances(user1), 3000 * 10**18);
        assertEq(htToken.balanceOf(user1), 7000 * 10**18);
        assertEq(htToken.balanceOf(address(tokenBank)), 3000 * 10**18);
    }
    
    function testWhitelistManagement() public {
        // 测试添加白名单
        address newSigner = address(0x4);
        nftMarket.addWhitelist(newSigner);
        assertTrue(nftMarket.isWhitelisted(newSigner));
        
        // 测试移除白名单
        nftMarket.removeWhitelist(newSigner);
        assertFalse(nftMarket.isWhitelisted(newSigner));
        
        // 测试批量添加白名单
        address[] memory addresses = new address[](2);
        addresses[0] = address(0x5);
        addresses[1] = address(0x6);
        
        nftMarket.addWhitelistBatch(addresses);
        assertTrue(nftMarket.isWhitelisted(address(0x5)));
        assertTrue(nftMarket.isWhitelisted(address(0x6)));
        // 确认原有白名单仍然存在
        assertTrue(nftMarket.isWhitelisted(whitelistSigner));
        
        // 测试批量移除白名单
        address[] memory removeAddresses = new address[](1);
        removeAddresses[0] = address(0x5);
        nftMarket.removeWhitelistBatch(removeAddresses);
        assertFalse(nftMarket.isWhitelisted(address(0x5)));
        assertTrue(nftMarket.isWhitelisted(address(0x6))); // 其他地址不受影响
    }
    
    function test_RevertWhen_UnauthorizedMint() public {
        // 非owner尝试铸造应该失败
        vm.prank(user1);
        vm.expectRevert();
        myNFT.adminMint(user1, "https://example.com/token/");
    }
    
    function test_RevertWhen_InsufficientBalance() public {
        // 余额不足的转账应该失败
        vm.prank(user1);
        vm.expectRevert();
        htToken.transfer(user2, 20000 * 10**18); // 超过余额
    }
    
    function test_RevertWhen_WithdrawExceedsBalance() public {
        // 取款超过余额应该失败
        vm.prank(user1);
        vm.expectRevert();
        tokenBank.withdraw(1000 * 10**18); // 没有存款就取款
    }

    // 测试 tokensReceived 回调购买功能
    function testNFTMarketTokensReceived() public {
        // 先铸造和上架 NFT
        myNFT.safeMint(user1, "https://example.com/token/1");
        
        vm.prank(user1);
        myNFT.approve(address(nftMarket), 1);
        
        vm.prank(user1);
        nftMarket.list(1, 1000 * 10**18);
        
        // 先转移代币到市场合约，然后直接调用 tokensReceived（模拟超额支付）
        vm.prank(user2);
        htToken.transfer(address(nftMarket), 1200 * 10**18);
        
        // 直接调用 tokensReceived 方法
        vm.prank(address(htToken));
        nftMarket.tokensReceived(user2, 1200 * 10**18, abi.encode(uint256(1)));
        
        // 检查所有权转移
        assertEq(myNFT.ownerOf(1), user2);
        
        // 检查代币转移（卖家收到1000，买家支付了1200但退回200）
        assertEq(htToken.balanceOf(user1), 11000 * 10**18); // 10000 + 1000
        assertEq(htToken.balanceOf(user2), 9000 * 10**18);  // 10000 - 1200 + 200 = 9000
        
        // 检查上架状态
        (, , bool active) = nftMarket.getListing(1);
        assertFalse(active);
    }

    // 测试 permitBuy 签名授权购买功能（简化版本，跳过复杂的EIP-712签名）
    function testNFTMarketPermitBuyRevert() public {
        // 先铸造和上架 NFT
        myNFT.safeMint(user1, "https://example.com/token/1");
        
        vm.prank(user1);
        myNFT.approve(address(nftMarket), 1);
        
        vm.prank(user1);
        nftMarket.list(1, 1000 * 10**18);
        
        // 测试非白名单用户调用 permitBuy 应该失败
        uint256 tokenId = 1;
        uint256 deadline = block.timestamp + 1 hours;
        
        // 使用无效签名
        bytes32 r = bytes32(uint256(1));
        bytes32 s = bytes32(uint256(2));
        uint8 v = 27;
        
        vm.prank(user1); // user1 不在白名单中
        vm.expectRevert("Buyer not whitelisted");
        nftMarket.permitBuy(tokenId, deadline, v, r, s);
        
        // 测试过期的 deadline（whitelistSigner 已经在 setUp 中添加到白名单）
        
        vm.prank(whitelistSigner);
        vm.expectRevert("PERMIT_DEADLINE_EXPIRED");
        nftMarket.permitBuy(tokenId, block.timestamp - 1, v, r, s); // 过期的 deadline
    }

    // 测试 getAllListings 功能
    function testGetAllListings() public {
        // 铸造多个 NFT 并上架
        myNFT.safeMint(user1, "https://example.com/token/1");
        myNFT.safeMint(user1, "https://example.com/token/2");
        myNFT.safeMint(user2, "https://example.com/token/3");
        
        // 授权
        vm.prank(user1);
        myNFT.setApprovalForAll(address(nftMarket), true);
        
        vm.prank(user2);
        myNFT.approve(address(nftMarket), 3);
        
        // 上架 NFT
        vm.prank(user1);
        nftMarket.list(1, 1000 * 10**18);
        
        vm.prank(user1);
        nftMarket.list(2, 2000 * 10**18);
        
        vm.prank(user2);
        nftMarket.list(3, 3000 * 10**18);
        
        // 获取所有上架信息
        (
            uint256[] memory tokenIds,
            address[] memory sellers,
            uint256[] memory prices
        ) = nftMarket.getAllListings();
        
        // 验证结果
        assertEq(tokenIds.length, 3);
        assertEq(tokenIds[0], 1);
        assertEq(tokenIds[1], 2);
        assertEq(tokenIds[2], 3);
        
        assertEq(sellers[0], user1);
        assertEq(sellers[1], user1);
        assertEq(sellers[2], user2);
        
        assertEq(prices[0], 1000 * 10**18);
        assertEq(prices[1], 2000 * 10**18);
        assertEq(prices[2], 3000 * 10**18);
        
        // 优化版本通过price > 0判断active状态
        assertTrue(prices[0] > 0);
        assertTrue(prices[1] > 0);
        assertTrue(prices[2] > 0);
    }

    // 测试 setWhitelistBatch 功能
    function testSetWhitelistBatch() public {
        // 先添加一些白名单
        nftMarket.addWhitelist(user1);
        nftMarket.addWhitelist(user2);
        
        // 准备新的白名单数组
        address[] memory newWhitelists = new address[](2);
        newWhitelists[0] = address(0x7);
        newWhitelists[1] = address(0x8);
        
        // 优化版本使用addWhitelistBatch替代setWhitelistBatch
        nftMarket.addWhitelistBatch(newWhitelists);
        
        // 验证原有白名单仍然存在
        assertTrue(nftMarket.isWhitelisted(user1));
        assertTrue(nftMarket.isWhitelisted(user2));
        assertTrue(nftMarket.isWhitelisted(whitelistSigner));
        
        // 验证新白名单生效
        assertTrue(nftMarket.isWhitelisted(address(0x7)));
        assertTrue(nftMarket.isWhitelisted(address(0x8)));
    }

    // 测试 getWhitelistAddresses 功能
    function testGetWhitelistAddresses() public {
        // 添加一些白名单地址
        nftMarket.addWhitelist(user1);
        nftMarket.addWhitelist(user2);
        
        // 获取白名单地址数组
        address[] memory whitelistAddresses = nftMarket.getWhitelistAddresses();
        
        // 验证结果（注意：whitelistSigner 在 setUp 中已添加）
        assertEq(whitelistAddresses.length, 3);
        assertEq(whitelistAddresses[0], whitelistSigner);
        assertEq(whitelistAddresses[1], user1);
        assertEq(whitelistAddresses[2], user2);
    }

    // 测试下架功能（通过购买实现）
    function testNFTDelisting() public {
        // 先铸造和上架 NFT
        myNFT.safeMint(user1, "https://example.com/token/1");
        
        vm.prank(user1);
        myNFT.approve(address(nftMarket), 1);
        
        vm.prank(user1);
        nftMarket.list(1, 1000 * 10**18);
        
        // 验证上架状态
        (, , bool activeBefore) = nftMarket.getListing(1);
        assertTrue(activeBefore);
        
        // 购买后自动下架
        vm.prank(user2);
        htToken.approve(address(nftMarket), 1000 * 10**18);
        
        vm.prank(user2);
        nftMarket.buyNFT(1);
        
        // 验证下架状态
        (, , bool activeAfter) = nftMarket.getListing(1);
        assertFalse(activeAfter);
    }
}