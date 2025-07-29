import { TypedDataDomain } from 'viem'

// 定义 TypedDataField 类型
interface TypedDataField {
  name: string
  type: string
}

// EIP-712 域定义
export const getEIP712Domain = (chainId: number, contractAddress: string, contractName: string): TypedDataDomain => ({
  name: contractName,
  version: '1',
  chainId,
  verifyingContract: contractAddress as `0x${string}`,
})

// TokenBank permitDeposit 的类型定义
export const PERMIT_TYPES: Record<string, TypedDataField[]> = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
}

// NFTMarket permitBuy 的类型定义
export const PERMIT_BUY_TYPES = {
  PermitBuy: [
    { name: 'buyer', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

// 生成 permitDeposit 的签名数据
export const createPermitMessage = (
  owner: string,
  spender: string,
  value: bigint,
  nonce: bigint,
  deadline: bigint
) => ({
  owner: owner as `0x${string}`,
  spender: spender as `0x${string}`,
  value,
  nonce,
  deadline,
})

// 生成 permitBuy 的签名数据
export function createPermitBuyMessage(
  buyer: string,
  tokenId: bigint,
  deadline: bigint
) {
  return {
    buyer: buyer as `0x${string}`,
    tokenId,
    deadline,
  };
}

// 解析签名结果
export const parseSignature = (signature: string) => {
  const sig = signature.slice(2) // 移除 0x
  const r = `0x${sig.slice(0, 64)}`
  const s = `0x${sig.slice(64, 128)}`
  const v = parseInt(sig.slice(128, 130), 16)
  
  return { v, r: r as `0x${string}`, s: s as `0x${string}` }
}