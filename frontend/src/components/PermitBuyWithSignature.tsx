"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { NFTMarketABI, CONTRACT_ADDRESSES } from "@/config/contracts";

export function PermitBuyWithSignature() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const [signatureData, setSignatureData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePermitBuy = async () => {
    if (!address || !signatureData.trim()) {
      alert("请输入签名数据");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 解析签名数据
      const parsedData = JSON.parse(signatureData);
      const { tokenId, deadline, v, r, s } = parsedData;
      
      if (!tokenId || !deadline || !v || !r || !s) {
        throw new Error("签名数据格式不正确");
      }
      
      // 调用 permitBuy
      writeContract({
        address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
        abi: NFTMarketABI,
        functionName: "permitBuy",
        args: [BigInt(tokenId), BigInt(deadline), v, r as `0x${string}`, s as `0x${string}`],
      });
      
    } catch (error) {
      console.error("Permit购买失败:", error);
      alert("签名数据格式错误或购买失败，请检查输入");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setSignatureData("");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        使用签名购买 NFT
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            项目方提供的签名数据
          </label>
          <textarea
            value={signatureData}
            onChange={(e) => setSignatureData(e.target.value)}
            placeholder='{
  "tokenId": "1",
  "deadline": "1234567890",
  "v": 27,
  "r": "0x...",
  "s": "0x...",
  "buyer": "0x..."
}'
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handlePermitBuy}
            disabled={!address || !signatureData.trim() || isPending || isConfirming || isSubmitting}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded-md font-medium transition-colors"
          >
            {isSubmitting || isPending
              ? "购买中..."
              : isConfirming
              ? "确认中..."
              : "使用签名购买"}
          </button>
          
          <button
            onClick={clearForm}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors"
          >
            清空
          </button>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              错误: {error.message}
            </p>
          </div>
        )}
        
        {isSuccess && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-600 dark:text-green-400">
              购买成功！交易哈希: {hash}
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          使用说明
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• 您必须在白名单中才能使用签名购买</li>
          <li>• 签名数据由项目方提供，包含tokenId、deadline、v、r、s等字段</li>
          <li>• 签名有过期时间，过期后无法使用</li>
          <li>• 每个签名只能使用一次</li>
          <li>• 请确保签名数据格式正确（JSON格式）</li>
        </ul>
      </div>
    </div>
  );
}