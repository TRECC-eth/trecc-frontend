import { baseSepolia, sepolia, mainnet } from 'viem/chains';
import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';

// Next.js loads .env automatically; no dotenv.config() needed
export const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

// baseSepolia for app; sepolia for ENS (trecc.eth subnames); mainnet for .eth ENS resolution
export const supportedChains = [baseSepolia, sepolia, mainnet] as const;

// Default chain for connection and balance display (Base Sepolia ETH)
export const defaultChain = baseSepolia;

// Wagmi config with custom RPCs to avoid rate-limiting on default endpoints
export const config = createConfig({
  chains: [baseSepolia, sepolia, mainnet],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [sepolia.id]: http('https://rpc.sepolia.org'),
    [mainnet.id]: http('https://cloudflare-eth.com'),
  },
});
