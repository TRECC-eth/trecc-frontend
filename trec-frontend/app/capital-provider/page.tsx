'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LenderVault from '../../components/LenderVault';

export default function CapitalProviderPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleDepositSuccess = useCallback(() => {
    router.push('/dashboard/lender');
  }, [router]);

  return (
    <div
      className={`flex flex-col items-center justify-start flex-grow px-4 md:px-8 py-8 md:py-16 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >

      <div className="w-full max-w-lg border border-zinc-800 rounded-2xl p-8">
        {/* Page header — left-aligned, no decorative icon */}
        <div className="mb-10">
          <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">
            Capital Provider
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100 tracking-tight leading-tight">
            Provide Liquidity
          </h1>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-sm">
            Deposit USDC or stake ETH to start earning yield. You'll be redirected to your dashboard after your first deposit.
          </p>
        </div>

        {/* Vault component */}
        <div
          className={`transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
        >
          <LenderVault onDepositSuccess={handleDepositSuccess} />
        </div>
      </div>
    </div>
  );
}
