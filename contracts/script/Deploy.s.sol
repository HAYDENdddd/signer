// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/HTToken.sol";
import "../src/MyNFT.sol";
import "../src/NFTmarket.sol";
import "../src/TokenBank.sol";

contract DeployScript is Script {
    HTT public htToken;
    MyNFT public myNFT;
    NFTMarket public nftMarket;
    TokenBank public tokenBank;

    function run() public {
        vm.startBroadcast();

        // Deploy HTT
        htToken = new HTT();
        console.log("HTT deployed at:", address(htToken));

        // Deploy MyNFT
        myNFT = new MyNFT();
        console.log("MyNFT deployed at:", address(myNFT));

        // Deploy NFTMarket
        nftMarket = new NFTMarket(address(myNFT), address(htToken));
        console.log("NFTMarket deployed at:", address(nftMarket));

        // Deploy TokenBank
        tokenBank = new TokenBank(address(htToken));
        console.log("TokenBank deployed at:", address(tokenBank));

        console.log("\n=== Deployment Summary ===");
        console.log("HTT Token:", address(htToken));
        console.log("MyNFT:", address(myNFT));
        console.log("NFTMarket:", address(nftMarket));
        console.log("TokenBank:", address(tokenBank));

        vm.stopBroadcast();
    }
}
