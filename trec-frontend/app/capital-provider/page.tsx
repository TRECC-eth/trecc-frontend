'use client';

import React, { useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LenderVault from '../../components/LenderVault';

export default function CapitalProviderPage() {
  const router = useRouter();

  const handleDepositSuccess = useCallback(() => {
    router.push('/dashboard/lender');
  }, [router]);

  return (
    <main className="min-h-screen px-4 pt-36 pb-10 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mb-10 flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-zinc-500 transition-colors duration-300 hover:text-zinc-200"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> TERMINATE SESSION
        </button>

        <section className="rounded-[2rem] border border-white/[0.08] bg-[#030303] p-7 shadow-[0_20px_50px_-10px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.02)] md:p-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-5 bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#8c8c8c_100%)] bg-clip-text text-3xl font-medium tracking-tight text-transparent">
              Liquidity Vault
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">
              Provide USDC to start earning yield. You will be taken to your dashboard after your first deposit.
            </p>
            <div className="text-left">
              <LenderVault onDepositSuccess={handleDepositSuccess} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
