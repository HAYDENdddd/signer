"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { NFTMarketABI, CONTRACT_ADDRESSES } from "@/config/contracts";

export function WhitelistManager() {
  const { address, isConnected } = useAccount();
  const [singleAddress, setSingleAddress] = useState("");
  const [batchAddresses, setBatchAddresses] = useState("");
  const [removeAddress, setRemoveAddress] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // 读取合约所有者
  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
    abi: NFTMarketABI,
    functionName: "owner",
  });

  // 读取白名单地址列表
  const { data: whitelistAddresses, refetch: refetchWhitelist } =
    useReadContract({
      address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
      abi: NFTMarketABI,
      functionName: "getWhitelistAddresses",
    });

  // 检查当前用户是否为合约所有者
  const isOwner =
    address && owner && address.toLowerCase() === owner.toLowerCase();

  // 添加单个白名单地址
  const handleAddSingle = async () => {
    if (!singleAddress) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
        abi: NFTMarketABI,
        functionName: "addWhitelist",
        args: [singleAddress as `0x${string}`],
      });
    } catch (error) {
      console.error("添加白名单失败:", error);
    }
  };

  // 批量添加白名单地址
  const handleAddBatch = async () => {
    if (!batchAddresses) return;

    try {
      const addresses = batchAddresses
        .split("\n")
        .map((addr) => addr.trim())
        .filter((addr) => addr.length > 0);

      writeContract({
        address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
        abi: NFTMarketABI,
        functionName: "addWhitelistBatch",
        args: [addresses as `0x${string}`[]],
      });
    } catch (error) {
      console.error("批量添加白名单失败:", error);
    }
  };

  // 移除白名单地址
  const handleRemove = async () => {
    if (!removeAddress) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
        abi: NFTMarketABI,
        functionName: "removeWhitelist",
        args: [removeAddress as `0x${string}`],
      });
    } catch (error) {
      console.error("移除白名单失败:", error);
    }
  };

  // 检查地址是否在白名单中
  const checkWhitelist = async (addressToCheck: string) => {
    if (!addressToCheck) return;

    try {
      const result = await useReadContract({
        address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
        abi: NFTMarketABI,
        functionName: "isWhitelisted",
        args: [addressToCheck as `0x${string}`],
      });
      console.log(`地址 ${addressToCheck} 白名单状态:`, result);
    } catch (error) {
      console.error("检查白名单失败:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          请连接钱包以管理白名单
        </p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
          ⚠️ 权限不足
        </h3>
        <p className="text-red-600 dark:text-red-400">
          只有合约所有者才能管理白名单
        </p>
        <p className="text-sm text-red-500 dark:text-red-500 mt-2">
          当前合约所有者:{" "}
          {owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : "加载中..."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        白名单管理
      </h2>

      {/* 当前白名单列表 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            当前白名单地址
          </h3>
          <button
            onClick={() => refetchWhitelist()}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            刷新列表
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
          {whitelistAddresses &&
          Array.isArray(whitelistAddresses) &&
          whitelistAddresses.length > 0 ? (
            <div className="space-y-2">
              {whitelistAddresses.map((addr: string, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {addr}
                  </span>
                  <button
                    onClick={() => setRemoveAddress(addr)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center">
              暂无白名单地址
            </p>
          )}
        </div>
      </div>

      {/* 添加单个地址 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
          添加单个地址
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="输入要添加的地址 (0x...)"
            value={singleAddress}
            onChange={(e) => setSingleAddress(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono"
          />
          <button
            onClick={handleAddSingle}
            disabled={isPending || isConfirming || !singleAddress}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {isPending
              ? "添加中..."
              : isConfirming
              ? "确认中..."
              : "添加到白名单"}
          </button>
        </div>
      </div>

      {/* 批量添加地址 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
          批量添加地址
        </h3>
        <div className="space-y-3">
          <textarea
            placeholder="每行输入一个地址&#10;0x1234...&#10;0x5678...&#10;0x9abc..."
            value={batchAddresses}
            onChange={(e) => setBatchAddresses(e.target.value)}
            rows={4}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono"
          />
          <button
            onClick={handleAddBatch}
            disabled={isPending || isConfirming || !batchAddresses}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {isPending
              ? "批量添加中..."
              : isConfirming
              ? "确认中..."
              : "批量添加到白名单"}
          </button>
        </div>
      </div>

      {/* 移除地址 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
          移除地址
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="输入要移除的地址 (0x...)"
            value={removeAddress}
            onChange={(e) => setRemoveAddress(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono"
          />
          <button
            onClick={handleRemove}
            disabled={isPending || isConfirming || !removeAddress}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {isPending
              ? "移除中..."
              : isConfirming
              ? "确认中..."
              : "从白名单移除"}
          </button>
        </div>
      </div>

      {/* 交易状态 */}
      {hash && (
        <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            交易哈希: {hash}
          </p>
          {isConfirmed && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              ✅ 交易已确认，白名单已更新
            </p>
          )}
        </div>
      )}

      {/* 使用说明 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
          📋 白名单说明
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• 白名单用于 NFT 市场的 permitBuy 功能</li>
          <li>• 只有白名单中的地址才能签名授权其他用户购买 NFT</li>
          <li>• 只有合约所有者才能管理白名单</li>
          <li>• 添加地址前请确保地址格式正确 (0x开头的42位十六进制)</li>
          <li>• 批量添加时每行输入一个地址</li>
        </ul>
      </div>
    </div>
  );
}
