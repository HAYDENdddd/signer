"use client";

import { useState } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { AccountInfo } from "@/components/AccountInfo";
import { HTToken } from "@/components/HTToken";
import { MyNFT } from "@/components/MyNFT";
import { NFTMarket } from "@/components/NFTMarket";
import { TokenBank } from "@/components/TokenBank";
import { WhitelistManager } from "@/components/WhitelistManager";
import { PermitSignTool } from "@/components/PermitSignTool";
import { PermitBuyWithSignature } from "@/components/PermitBuyWithSignature";

type TabType = "account" | "token" | "nft" | "market" | "bank" | "whitelist" | "permit" | "permitbuy";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("account");

  const tabs = [
    { id: "account" as TabType, name: "账户信息", icon: "👤" },
    { id: "token" as TabType, name: "HTToken", icon: "🪙" },
    { id: "nft" as TabType, name: "MyNFT", icon: "🖼️" },
    { id: "market" as TabType, name: "NFT市场", icon: "🛒" },
    { id: "bank" as TabType, name: "代币银行", icon: "🏦" },
    { id: "whitelist" as TabType, name: "白名单管理", icon: "📋" },
    { id: "permit" as TabType, name: "签名工具", icon: "✍️" },
    { id: "permitbuy" as TabType, name: "签名购买", icon: "🎫" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountInfo />;
      case "token":
        return <HTToken />;
      case "nft":
        return <MyNFT />;
      case "market":
        return <NFTMarket />;
      case "bank":
        return <TokenBank />;
      case "whitelist":
        return <WhitelistManager />;
      case "permit":
        return <PermitSignTool />;
      case "permitbuy":
        return <PermitBuyWithSignature />;
      default:
        return <AccountInfo />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Web3 DApp
              </div>
              <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                基于 Next.js + viem + AppKit
              </div>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out">
          {renderContent()}
        </div>

        {/* Contract Addresses Info */}
        <div className="mt-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-3">
            ⚠️ 重要提示
          </h3>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
            <p>请确保已正确配置以下内容：</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                在{" "}
                <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">
                  .env.local
                </code>{" "}
                中设置您的 AppKit Project ID
              </li>
              <li>
                在{" "}
                <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">
                  src/config/contracts.ts
                </code>{" "}
                中更新合约地址
              </li>
              <li>确保您的钱包连接到正确的网络</li>
              <li>确保合约已正确部署并验证</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">
              基于 Next.js、viem 和 AppKit 构建的现代化 Web3 DApp
            </p>
            <p className="text-xs mt-2">
              支持 HTToken (ERC20)、MyNFT (ERC721)、NFT市场 和 代币银行
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
