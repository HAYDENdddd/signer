"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignTypedData,
  useChainId,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import {
  NFTMarketABI,
  HTTokenABI,
  MyNFTABI,
  CONTRACT_ADDRESSES,
} from "@/config/contracts";
import {
  getEIP712Domain,
  PERMIT_BUY_TYPES,
  createPermitBuyMessage,
  parseSignature,
} from "@/utils/eip712";

interface Listing {
  tokenId: bigint;
  seller: string;
  price: bigint;
  active: boolean;
}

export function NFTMarket() {
  const { address, isConnected } = useAccount();
  const [listTokenId, setListTokenId] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [isPermitSigning, setIsPermitSigning] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });
  const { signTypedDataAsync } = useSignTypedData();
  const chainId = useChainId();

  // 读取所有上架信息
  const { data: allListingsData, refetch: refetchListings } = useReadContract({
    address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
    abi: NFTMarketABI,
    functionName: "getAllListings",
  });

  // 读取用户HTT余额
  const { data: httBalance, refetch: refetchHTTBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.HTToken as `0x${string}`,
    abi: HTTokenABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // 处理上架数据
  useEffect(() => {
    if (
      allListingsData &&
      Array.isArray(allListingsData) &&
      allListingsData.length === 4
    ) {
      const [tokenIds, sellers, prices, actives] = allListingsData as [
        bigint[],
        string[],
        bigint[],
        boolean[]
      ];
      const formattedListings: Listing[] = tokenIds.map(
        (tokenId: bigint, index: number) => ({
          tokenId,
          seller: sellers[index],
          price: prices[index],
          active: actives[index],
        })
      );
      setListings(formattedListings);
    }
  }, [allListingsData]);

  // 上架NFT
  const handleListNFT = async () => {
    if (!listTokenId || !listPrice) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
        abi: NFTMarketABI,
        functionName: "list",
        args: [BigInt(listTokenId), parseEther(listPrice)],
      });
    } catch (error) {
      console.error("上架失败:", error);
    }
  };

  // 购买NFT
  const handleBuyNFT = async (tokenId: bigint) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
        abi: NFTMarketABI,
        functionName: "buyNFT",
        args: [tokenId],
      });
    } catch (error) {
      console.error("购买失败:", error);
    }
  };

  // Permit 购买NFT（需要项目方签名）
  const handlePermitBuy = async (tokenId: bigint) => {
    if (!address) return;

    try {
      setIsPermitSigning(true);

      // 提示用户需要项目方签名
      alert(
        "Permit购买功能需要项目方提供签名。请联系项目方获取针对您地址和此NFT的授权签名。"
      );

      // 这里应该是从项目方获取的签名数据
      // 为了演示，我们使用模拟数据
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // 实际使用时，这些签名参数应该由项目方提供
      const mockV = 27;
      const mockR =
        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
      const mockS =
        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

      // 调用 permitBuy（使用项目方提供的签名）
      writeContract({
        address: CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
        abi: NFTMarketABI,
        functionName: "permitBuy",
        args: [tokenId, deadline, mockV, mockR, mockS],
      });
    } catch (error) {
      console.error("Permit购买失败:", error);
    } finally {
      setIsPermitSigning(false);
    }
  };

  // 授权HTT给市场合约
  const handleApproveHTT = async (amount: string) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.HTToken as `0x${string}`,
        abi: HTTokenABI,
        functionName: "approve",
        args: [
          CONTRACT_ADDRESSES.NFTMarket as `0x${string}`,
          parseEther(amount),
        ],
      });
    } catch (error) {
      console.error("授权失败:", error);
    }
  };

  // 授权NFT给市场合约
  const handleApproveNFT = async (tokenId: string) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.MyNFT as `0x${string}`,
        abi: MyNFTABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.NFTMarket as `0x${string}`, BigInt(tokenId)],
      });
    } catch (error) {
      console.error("NFT授权失败:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          请连接钱包以使用NFT市场
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        NFT市场
      </h2>

      {/* 用户余额信息 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
        <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
          我的HTT余额
        </h3>
        <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
          {httBalance ? formatEther(httBalance) : "0"} HTT
        </p>
        <button
          onClick={() => refetchHTTBalance()}
          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          刷新余额
        </button>
      </div>

      {/* 上架NFT */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
          上架我的NFT
        </h3>
        <div className="space-y-3">
          <input
            type="number"
            placeholder="NFT Token ID"
            value={listTokenId}
            onChange={(e) => setListTokenId(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <input
            type="number"
            placeholder="价格 (HTT)"
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <div className="flex gap-3">
            <button
              onClick={() => handleApproveNFT(listTokenId)}
              disabled={isPending || isConfirming || !listTokenId}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              授权NFT
            </button>
            <button
              onClick={handleListNFT}
              disabled={isPending || isConfirming || !listTokenId || !listPrice}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isPending ? "上架中..." : isConfirming ? "确认中..." : "上架NFT"}
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 上架前需要先授权NFT给市场合约
          </p>
        </div>
      </div>

      {/* 市场列表 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            市场上的NFT
          </h3>
          <button
            onClick={() => refetchListings()}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            刷新列表
          </button>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            暂无NFT在售
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <div
                key={listing.tokenId.toString()}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-800 dark:text-white">
                      NFT #{listing.tokenId.toString()}
                    </h4>
                    <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      在售
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      卖家: {listing.seller.slice(0, 6)}...
                      {listing.seller.slice(-4)}
                    </p>
                  </div>

                  <div className="text-lg font-semibold text-gray-800 dark:text-white">
                    {formatEther(listing.price)} HTT
                  </div>

                  <div className="space-y-2">
                    {listing.seller.toLowerCase() === address?.toLowerCase() ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                        这是您的NFT
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            handleApproveHTT(formatEther(listing.price))
                          }
                          disabled={isPending || isConfirming}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white py-2 rounded text-sm font-medium transition-colors"
                        >
                          授权HTT
                        </button>
                        <button
                          onClick={() => handleBuyNFT(listing.tokenId)}
                          disabled={isPending || isConfirming}
                          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded text-sm font-medium transition-colors"
                        >
                          {isPending
                            ? "购买中..."
                            : isConfirming
                            ? "确认中..."
                            : "购买"}
                        </button>
                        <button
                          onClick={() => handlePermitBuy(listing.tokenId)}
                          disabled={
                            isPending || isConfirming || isPermitSigning
                          }
                          className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white py-2 rounded text-sm font-medium transition-colors"
                        >
                          {isPermitSigning
                            ? "签名中..."
                            : isPending
                            ? "购买中..."
                            : isConfirming
                            ? "确认中..."
                            : "Permit 购买"}
                        </button>
                        <div className="text-xs text-purple-600 dark:text-purple-400 text-center">
                          🔐 无需预先授权，一步完成购买
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

      {/* 使用说明 */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
          📋 使用说明
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>1. 上架NFT前需要先授权NFT给市场合约</li>
          <li>2. 购买NFT前需要先授权足够的HTT给市场合约</li>
          <li>3. 确保您有足够的HTT余额来购买NFT</li>
          <li>4. 交易完成后列表会自动更新</li>
        </ul>
      </div>
    </div>
  );
}
