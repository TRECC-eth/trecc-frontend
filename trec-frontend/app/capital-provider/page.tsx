'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LenderVault from '../../components/LenderVault';

export default function CapitalProviderPage() {
  const router = useRouter();

  const handleDepositSuccess = useCallback(() => {
    router.push('/dashboard/lender');
  }, [router]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full z-10 relative min-h-[90vh] flex flex-col">

      <div className="
        p-10 md:p-14 rounded-[2rem] relative
        bg-[#030303] border border-white/[0.08]
        shadow-[0_20px_50px_-10px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.02)]
      ">
        <h2 className="text-3xl font-medium mb-10 text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#8c8c8c_100%)] tracking-tight">
          Liquidity Vault
        </h2>
        <div className="w-full">
          <p className="relative z-10 text-slate-400 mb-8">Provide USDC to start earning yield. You will be taken to your dashboard after your first deposit.</p>
          <div className="relative z-10 w-full">
            <LenderVault onDepositSuccess={handleDepositSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
}
