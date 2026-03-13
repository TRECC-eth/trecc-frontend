import { cookieStorage, createStorage } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
// 1. Make sure we import baseSepolia and AppKitNetwork directly from Reown
import { baseSepolia, type AppKitNetwork } from '@reown/appkit/networks';

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'YOUR_REOWN_PROJECT_ID';

// 2. THE FIX: Explicitly cast the array as a tuple of AppKitNetwork
export const networks = [baseSepolia] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  networks,
  projectId,
});

export const config = wagmiAdapter.wagmiConfig;