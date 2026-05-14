import { sepolia, mainnet } from 'viem/chains';
import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';

// Next.js loads .env automatically; no dotenv.config() needed
export const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

// sepolia for app + ENS subnames; mainnet for .eth ENS resolution
export const supportedChains = [sepolia, mainnet] as const;

// Default chain for connection and balance display (Ethereum Sepolia ETH)
export const defaultChain = sepolia;

// Wagmi config with custom RPCs to avoid rate-limiting on default endpoints
export const config = createConfig({
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http('https://rpc.sepolia.org'),
    [mainnet.id]: http('https://cloudflare-eth.com'),
  },
});
