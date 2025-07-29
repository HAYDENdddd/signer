"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { HTTokenABI, CONTRACT_ADDRESSES } from "@/config/contracts";

export function HTToken() {
  const { address, isConnected } = useAccount();
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [approveSpender, setApproveSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // 读取代币信息
  const { data: name } = useReadContract({
    address: CONTRACT_ADDRESSES.HTToken as `0x${string}`,
    abi: HTTokenABI,
    functionName: "name",
  });

  const { data: symbol } = useReadContract({
    address: CONTRACT_ADDRESSES.HTToken as `0x${string}`,
    abi: HTTokenABI,
    functionName: "symbol",
  });

  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.HTToken as `0x${string}`,
    abi: HTTokenABI,
    functionName: "totalSupply",
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.HTToken as `0x${string}`,
    abi: HTTokenABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.HTToken as `0x${string}`,
        abi: HTTokenABI,
        functionName: "transfer",
        args: [transferTo as `0x${string}`, parseEther(transferAmount)],
      });
    } catch (error) {
      console.error("转账失败:", error);
    }
  };

  const handleApprove = async () => {
    if (!approveSpender || !approveAmount) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.HTToken as `0x${string}`,
        abi: HTTokenABI,
        functionName: "approve",
        args: [approveSpender as `0x${string}`, parseEther(approveAmount)],
      });
    } catch (error) {
      console.error("授权失败:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          请连接钱包以查看HTToken信息
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        HTToken (HTT)
      </h2>

      {/* 代币信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            代币名称
          </h3>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {name || "加载中..."}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            代币符号
          </h3>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {symbol || "加载中..."}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            总供应量
          </h3>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {totalSupply ? formatEther(totalSupply) : "加载中..."}
          </p>
        </div>
      </div>

      {/* 用户余额 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
        <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
          我的余额
        </h3>
        <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
          {balance ? formatEther(balance) : "0"} HTT
        </p>
        <button
          onClick={() => refetchBalance()}
          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          刷新余额
        </button>
      </div>

      {/* 转账功能 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
            转账
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="接收地址"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
            <input
              type="number"
              placeholder="转账数量"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
            <button
              onClick={handleTransfer}
              disabled={
                isPending || isConfirming || !transferTo || !transferAmount
              }
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isPending ? "发送中..." : isConfirming ? "确认中..." : "转账"}
            </button>
          </div>
        </div>

        {/* 授权功能 */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
            授权
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="被授权地址"
              value={approveSpender}
              onChange={(e) => setApproveSpender(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
            <input
              type="number"
              placeholder="授权数量"
              value={approveAmount}
              onChange={(e) => setApproveAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            />
            <button
              onClick={handleApprove}
              disabled={
                isPending || isConfirming || !approveSpender || !approveAmount
              }
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isPending ? "授权中..." : isConfirming ? "确认中..." : "授权"}
            </button>
          </div>
        </div>
      </div>

      {/* 交易状态 */}
      {hash && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
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
    </div>
  );
}
