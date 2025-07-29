import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, polygon, base, sepolia } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { defineChain } from 'viem'

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'your-project-id-here'

// 2. Create a metadata object - optional
const metadata = {
  name: 'Web3 DApp',
  description: 'A modern Web3 application built with Next.js, viem, and AppKit',
  url: 'https://web3dapp.example', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// 3. Define local Anvil network
const anvil = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://localhost:8545' },
  },
  testnet: true,
})

// 3. Set the networks
const networks: AppKitNetwork[] = [anvil as AppKitNetwork, mainnet, arbitrum, polygon, base, sepolia]

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})

// 5. Create modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as [AppKitNetwork, ...AppKitNetwork[]],
  projectId,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  }
})

export const config = wagmiAdapter.wagmiConfig

// 6. Create query client
export const queryClient = new QueryClient()