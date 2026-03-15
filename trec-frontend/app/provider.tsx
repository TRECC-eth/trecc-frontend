'use client';

import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';

// THE FIX: Using the relative path to go up one level and into the config folder
import { wagmiAdapter, projectId, networks, defaultNetwork, customRpcUrls } from '../config/reown';

const queryClient = new QueryClient();

const metadata = {
  name: 'TRECC Protocol',
  description: 'ERC-8004 AI Agent Lending',
  url: 'http://trecc.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Initialize the Reown Modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork,
  customRpcUrls,
  metadata,
  themeMode: 'dark',
  features: {
    analytics: true,
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}