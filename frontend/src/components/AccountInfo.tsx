"use client";

import { useAccount, useBalance, useEnsName } from "wagmi";
import { formatEther } from "viem";

export function AccountInfo() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });

  if (!isConnected || !address) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Please connect your wallet to view account information
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Account Information
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Address
          </label>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <code className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
              {address}
            </code>
          </div>
        </div>

        {ensName && (
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              ENS Name
            </label>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {ensName}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Network
          </label>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {chain?.name || "Unknown"}
            </span>
          </div>
        </div>

        {balance && (
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Balance
            </label>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {parseFloat(formatEther(balance.value)).toFixed(4)}{" "}
                {balance.symbol}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
