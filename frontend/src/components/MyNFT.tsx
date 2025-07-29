"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { MyNFTABI, CONTRACT_ADDRESSES } from "@/config/contracts";

export function MyNFT() {
  const { address, isConnected } = useAccount();
  const [mintTo, setMintTo] = useState("");
  const [tokenURI, setTokenURI] = useState("");
  const [queryTokenId, setQueryTokenId] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // 读取当前TokenId
  const { data: currentTokenId, refetch: refetchCurrentTokenId } =
    useReadContract({
      address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
      abi: MyNFTABI,
      functionName: "getCurrentTokenId",
    });

  // 读取用户NFT余额
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
    abi: MyNFTABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // 查询特定NFT的拥有者
  const { data: tokenOwner } = useReadContract({
    address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
    abi: MyNFTABI,
    functionName: "ownerOf",
    args: queryTokenId ? [BigInt(queryTokenId)] : undefined,
    query: {
      enabled: !!queryTokenId,
    },
  });

  // 查询特定NFT的URI
  const { data: tokenURIData } = useReadContract({
    address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
    abi: MyNFTABI,
    functionName: "tokenURI",
    args: queryTokenId ? [BigInt(queryTokenId)] : undefined,
    query: {
      enabled: !!queryTokenId,
    },
  });

  const handleMint = async () => {
    if (!mintTo || !tokenURI) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
        abi: MyNFTABI,
        functionName: "safeMint",
        args: [mintTo as `0x${string}`, tokenURI],
      });
    } catch (error) {
      console.error("铸造失败:", error);
    }
  };

  const handleMintToSelf = async () => {
    if (!address || !tokenURI) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
        abi: MyNFTABI,
        functionName: "safeMint",
        args: [address, tokenURI],
      });
    } catch (error) {
      console.error("铸造失败:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          请连接钱包以使用NFT功能
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        MyNFT (MNFT)
      </h2>

      {/* NFT统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            下一个Token ID
          </h3>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {currentTokenId ? currentTokenId.toString() : "加载中..."}
          </p>
          <button
            onClick={() => refetchCurrentTokenId()}
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            刷新
          </button>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
            我的NFT数量
          </h3>
          <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
            {balance ? balance.toString() : "0"}
          </p>
          <button
            onClick={() => refetchBalance()}
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            刷新余额
          </button>
        </div>
      </div>

      {/* 铸造NFT */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
            铸造NFT
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="接收地址 (留空则铸造给自己)"
              value={mintTo}
              onChange={(e) => setMintTo(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
            <input
              type="text"
              placeholder="Token URI (元数据链接)"
              value={tokenURI}
              onChange={(e) => setTokenURI(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
            <div className="flex gap-3">
              <button
                onClick={handleMint}
                disabled={isPending || isConfirming || !mintTo || !tokenURI}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
              >
                {isPending
                  ? "铸造中..."
                  : isConfirming
                  ? "确认中..."
                  : "铸造给指定地址"}
              </button>
              <button
                onClick={handleMintToSelf}
                disabled={isPending || isConfirming || !tokenURI}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
              >
                {isPending
                  ? "铸造中..."
                  : isConfirming
                  ? "确认中..."
                  : "铸造给自己"}
              </button>
            </div>
          </div>
        </div>

        {/* 查询NFT信息 */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
            查询NFT信息
          </h3>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Token ID"
              value={queryTokenId}
              onChange={(e) => setQueryTokenId(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />

            {queryTokenId && (
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    拥有者
                  </h4>
                  <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                    {tokenOwner || "未找到或加载中..."}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Token URI
                  </h4>
                  <p className="text-sm text-gray-800 dark:text-gray-200 break-all">
                    {tokenURIData || "未找到或加载中..."}
                  </p>
                  {tokenURIData && (
                    <a
                      href={tokenURIData}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      查看元数据
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 交易状态 */}
      {hash && (
        <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            交易哈希: {hash}
          </p>
          {isConfirmed && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              ✅ 交易已确认
            </p>
          )}
        </div>
      )}

      {/* 使用提示 */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          💡 使用提示
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Token URI 应该指向包含NFT元数据的JSON文件</li>
          <li>• 元数据通常包含名称、描述、图片等信息</li>
          <li>• 可以使用IPFS或其他去中心化存储服务</li>
        </ul>
      </div>
    </div>
  );
}
