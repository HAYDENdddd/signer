"use client";

import { useState } from "react";
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
  TokenBankABI,
  HTTokenABI,
  CONTRACT_ADDRESSES,
} from "@/config/contracts";
import {
  getEIP712Domain,
  PERMIT_TYPES,
  createPermitMessage,
  parseSignature,
} from "@/utils/eip712";

export function TokenBank() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [permitDepositAmount, setPermitDepositAmount] = useState("");
  const [isPermitSigning, setIsPermitSigning] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });
  const { signTypedDataAsync } = useSignTypedData();

  // 读取用户的 nonce
  const { data: nonce } = useReadContract({
    address: CONTRACT_ADDRESSES.HTToken as `0x${string}`,
    abi: HTTokenABI,
    functionName: "nonces",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // 使用 permit 进行存款
  const handlePermitDeposit = async () => {
    if (!permitDepositAmount || !address || nonce === undefined) return;

    setIsPermitSigning(true);
    try {
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时后过期
      const amount = parseEther(permitDepositAmount);

      const domain = getEIP712Domain(
        chainId,
        CONTRACT_ADDRESSES.HTToken,
        "HTToken"
      );
      const message = createPermitMessage(
        address,
        CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        amount,
        nonce as bigint,
        BigInt(deadline)
      );

      const signature = await signTypedDataAsync({
        domain,
        types: PERMIT_TYPES,
        primaryType: "Permit",
        message,
      });

      const { v, r, s } = parseSignature(signature);

      writeContract({
        address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        abi: TokenBankABI,
        functionName: "permitDeposit",
        args: [amount, BigInt(deadline), v, r, s],
      });

      setIsPermitSigning(false);
    } catch (error) {
      console.error("Permit存款失败:", error);
      setIsPermitSigning(false);
    }
  };

  // 读取用户在银行的余额
  const { data: bankBalance, refetch: refetchBankBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
    abi: TokenBankABI,
    functionName: "balances",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
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

  // 存款
  const handleDeposit = async () => {
    if (!depositAmount) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        abi: TokenBankABI,
        functionName: "deposit",
        args: [parseEther(depositAmount)],
      });
    } catch (error) {
      console.error("存款失败:", error);
    }
  };

  // 取款
  const handleWithdraw = async () => {
    if (!withdrawAmount) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        abi: TokenBankABI,
        functionName: "withdraw",
        args: [parseEther(withdrawAmount)],
      });
    } catch (error) {
      console.error("取款失败:", error);
    }
  };

  // 授权HTT给银行合约
  const handleApprove = async () => {
    if (!approveAmount) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.HTToken as `0x${string}`,
        abi: HTTokenABI,
        functionName: "approve",
        args: [
          CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
          parseEther(approveAmount),
        ],
      });
    } catch (error) {
      console.error("授权失败:", error);
    }
  };

  // 一键存入所有余额
  const handleDepositAll = async () => {
    if (!httBalance) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        abi: TokenBankABI,
        functionName: "deposit",
        args: [httBalance],
      });
    } catch (error) {
      console.error("存款失败:", error);
    }
  };

  // 一键取出所有余额
  const handleWithdrawAll = async () => {
    if (!bankBalance) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.TokenBank as `0x${string}`,
        abi: TokenBankABI,
        functionName: "withdraw",
        args: [bankBalance],
      });
    } catch (error) {
      console.error("取款失败:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          请连接钱包以使用代币银行
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        代币银行
      </h2>

      {/* 余额信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
            钱包HTT余额
          </h3>
          <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
            {httBalance ? formatEther(httBalance) : "0"} HTT
          </p>
          <button
            onClick={() => refetchHTTBalance()}
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            刷新
          </button>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
            银行存款余额
          </h3>
          <p className="text-lg font-semibold text-green-800 dark:text-green-200">
            {bankBalance ? formatEther(bankBalance) : "0"} HTT
          </p>
          <button
            onClick={() => refetchBankBalance()}
            className="mt-2 text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 授权功能 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
          授权HTT给银行
        </h3>
        <div className="space-y-3">
          <input
            type="number"
            placeholder="授权数量"
            value={approveAmount}
            onChange={(e) => setApproveAmount(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <button
            onClick={handleApprove}
            disabled={isPending || isConfirming || !approveAmount}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {isPending ? "授权中..." : isConfirming ? "确认中..." : "授权HTT"}
          </button>
        </div>
        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 存款前需要先授权HTT给银行合约
          </p>
        </div>
      </div>

      {/* 存款功能 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
          存款
        </h3>
        <div className="space-y-3">
          <input
            type="number"
            placeholder="存款数量"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <div className="flex gap-3">
            <button
              onClick={handleDeposit}
              disabled={isPending || isConfirming || !depositAmount}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isPending ? "存款中..." : isConfirming ? "确认中..." : "存款"}
            </button>
            <button
              onClick={handleDepositAll}
              disabled={
                isPending ||
                isConfirming ||
                !httBalance ||
                httBalance === BigInt(0)
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              存入全部
            </button>
          </div>
        </div>
      </div>

      {/* Permit 存款功能 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
          Permit 存款 (无需预先授权)
        </h3>
        <div className="space-y-3">
          <input
            type="number"
            placeholder="Permit存款数量"
            value={permitDepositAmount}
            onChange={(e) => setPermitDepositAmount(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <button
            onClick={handlePermitDeposit}
            disabled={
              isPending ||
              isConfirming ||
              isPermitSigning ||
              !permitDepositAmount ||
              nonce === undefined
            }
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {isPermitSigning
              ? "签名中..."
              : isPending
              ? "存款中..."
              : isConfirming
              ? "确认中..."
              : "Permit 存款"}
          </button>
        </div>
        <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            🔐 使用离线签名授权，无需预先调用 approve，一步完成存款
          </p>
        </div>
      </div>

      {/* 取款功能 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
          取款
        </h3>
        <div className="space-y-3">
          <input
            type="number"
            placeholder="取款数量"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
          <div className="flex gap-3">
            <button
              onClick={handleWithdraw}
              disabled={isPending || isConfirming || !withdrawAmount}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isPending ? "取款中..." : isConfirming ? "确认中..." : "取款"}
            </button>
            <button
              onClick={handleWithdrawAll}
              disabled={
                isPending ||
                isConfirming ||
                !bankBalance ||
                bankBalance === BigInt(0)
              }
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              取出全部
            </button>
          </div>
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
              ✅ 交易已确认
            </p>
          )}
        </div>
      )}

      {/* 使用说明 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
          📋 使用说明
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>1. 首次使用需要先授权HTT给银行合约</li>
          <li>2. 授权后即可进行存款操作</li>
          <li>3. 取款无需额外授权，直接从银行余额中扣除</li>
          <li>4. 可以使用&quot;全部&quot;按钮快速存入或取出所有余额</li>
          <li>5. 银行合约会安全保管您的代币</li>
        </ul>
      </div>
    </div>
  );
}
