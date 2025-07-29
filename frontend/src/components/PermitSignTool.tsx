"use client";

import { useState } from "react";
import {
  useAccount,
  useSignTypedData,
  useChainId,
} from "wagmi";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import {
  getEIP712Domain,
  PERMIT_BUY_TYPES,
  createPermitBuyMessage,
  parseSignature,
} from "@/utils/eip712";

export function PermitSignTool() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();
  
  const [buyerAddress, setBuyerAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [signature, setSignature] = useState<{
    v: number;
    r: string;
    s: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSign = async () => {
    if (!address || !buyerAddress || !tokenId || !deadline) {
      alert("请填写所有必需字段");
      return;
    }

    try {
      setIsLoading(true);
      
      // 构建 EIP-712 域和消息
      const domain = getEIP712Domain(
        chainId,
        CONTRACT_ADDRESSES.NFTMarket,
        "NFTMarket"
      );
      
      const message = createPermitBuyMessage(
        buyerAddress as `0x${string}`,
        BigInt(tokenId),
        BigInt(deadline)
      );

      // 签名
      const sig = await signTypedDataAsync({
        domain,
        types: PERMIT_BUY_TYPES,
        primaryType: "PermitBuy",
        message,
      });

      // 解析签名
      const { v, r, s } = parseSignature(sig);
      setSignature({ v, r, s });
      
    } catch (error) {
      console.error("签名失败:", error);
      alert("签名失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const copySignature = () => {
    if (!signature) return;
    
    const signatureData = {
      tokenId,
      deadline,
      v: signature.v,
      r: signature.r,
      s: signature.s,
      buyer: buyerAddress
    };
    
    navigator.clipboard.writeText(JSON.stringify(signatureData, null, 2));
    alert("签名数据已复制到剪贴板");
  };

  const setDefaultDeadline = () => {
    // 设置1小时后过期
    const oneHourLater = Math.floor(Date.now() / 1000) + 3600;
    setDeadline(oneHourLater.toString());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        项目方签名工具
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            买家地址
          </label>
          <input
            type="text"
            value={buyerAddress}
            onChange={(e) => setBuyerAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            NFT Token ID
          </label>
          <input
            type="number"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            过期时间戳
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="Unix时间戳"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={setDefaultDeadline}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              1小时后
            </button>
          </div>
        </div>
        
        <button
          onClick={handleSign}
          disabled={isLoading || !address || !buyerAddress || !tokenId || !deadline}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded-md font-medium transition-colors"
        >
          {isLoading ? "签名中..." : "生成签名"}
        </button>
        
        {signature && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
              签名结果
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Token ID:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{tokenId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Deadline:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{deadline}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">V:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{signature.v}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">R:</span>
                <span className="ml-2 text-gray-900 dark:text-white break-all">{signature.r}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">S:</span>
                <span className="ml-2 text-gray-900 dark:text-white break-all">{signature.s}</span>
              </div>
            </div>
            <button
              onClick={copySignature}
              className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-medium transition-colors"
            >
              复制签名数据
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          使用说明
        </h4>
        <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• 只有合约所有者可以生成有效签名</li>
          <li>• 买家必须在白名单中才能使用签名购买</li>
          <li>• 签名有过期时间，过期后无法使用</li>
          <li>• 每个签名只能使用一次</li>
        </ul>
      </div>
    </div>
  );
}