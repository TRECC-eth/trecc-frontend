import { cookieStorage, createStorage } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
// 1. Make sure we import baseSepolia and AppKitNetwork directly from Reown
import { baseSepolia, sepolia, mainnet, type AppKitNetwork } from '@reown/appkit/networks';

// Next.js loads .env automatically; no dotenv.config() needed
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'YOUR_REOWN_PROJECT_ID';

// baseSepolia for app; sepolia for ENS (trecc.eth subnames); mainnet for .eth ENS resolution
export const networks = [baseSepolia, sepolia, mainnet] as [AppKitNetwork, ...AppKitNetwork[]];

// Default chain for connection and balance display (so Reown modal shows Base Sepolia ETH)
export const defaultNetwork = baseSepolia;

// Custom RPC so balance fetches succeed (default Base Sepolia RPC can be rate-limited)
const customRpcUrls: Record<string, { url: string }[]> = {
  'eip155:84532': [{ url: 'https://sepolia.base.org' }],
  'eip155:11155111': [{ url: 'https://rpc.sepolia.org' }],
  'eip155:1': [{ url: 'https://cloudflare-eth.com' }],
};

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  networks,
  projectId,
  customRpcUrls,
});

export const config = wagmiAdapter.wagmiConfig;
export { customRpcUrls };