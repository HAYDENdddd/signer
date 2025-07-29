// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {HTT} from "../src/HTToken.sol";
import {MyNFT} from "../src/MyNFT.sol";
import {NFTMarket} from "../src/NFTmarket.sol";
import {TokenBank} from "../src/TokenBank.sol";

contract AllContractsTest is Test {
    HTT public htToken;
    MyNFT public myNFT;
    NFTMarket public nftMarket;
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
        nftMarket = new NFTMarket(address(myNFT), address(htToken));
        
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
}