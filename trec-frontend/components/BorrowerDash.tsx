'use client';

import React, { useState } from 'react';
import { Bot, Zap, ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2, User, FileText, MapPin, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

// Mock KYC data – looks like real borrower verification
const MOCK_KYC = {
  status: 'verified' as const,
  completedAt: '2025-03-12T14:32:00Z',
  tier: 'Tier 2',
  personal: {
    fullName: 'Alex Rivera',
    dateOfBirth: '1988-07-23',
    nationality: 'United States',
    countryOfResidence: 'United States',
    address: '2847 West Oak Boulevard, Apt 4B',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94114',
    email: 'a.rivera@email.com',
    phone: '+1 (415) 555-0192',
  },
  identity: {
    documentType: 'Passport',
    documentNumber: '•••••••• 4829',
    issuingCountry: 'USA',
    expiryDate: '2030-11-15',
  },
  verificationSteps: [
    { id: 'identity', label: 'Identity document verified', done: true },
    { id: 'address', label: 'Address verification complete', done: true },
    { id: 'liveness', label: 'Liveness check passed', done: true },
    { id: 'sanctions', label: 'Sanctions & PEP screening clear', done: true },
  ],
};

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

export default function BorrowerDashboard() {
  const [borrowAmount, setBorrowAmount] = useState<number | ''>(1000);
  const [aiStatus, setAiStatus] = useState<'scanning' | 'opportunity' | 'executing' | 'monitoring'>('scanning');
  const [kycExpanded, setKycExpanded] = useState(true);

  // --- The TREC Dynamic Collateral Math ---
  const calculateCollateral = (amount: number) => {
    if (!amount || amount <= 0) return 0;
    if (amount <= 1000) return 110; 
    return amount * 0.12; 
  };

  const collateralRequired = calculateCollateral(Number(borrowAmount));

  // Simulate the AI finding a deal after 3 seconds
  React.useEffect(() => {
    if (aiStatus === 'scanning') {
      const timer = setTimeout(() => setAiStatus('opportunity'), 3000);
      return () => clearTimeout(timer);
    }
  }, [aiStatus]);

  // --- BITGO MPC EXECUTION WIRING ---
  const handleApproveTrade = async () => {
    setAiStatus('executing');
    
    try {
      const response = await fetch('/api/bitgo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", 
          value: "0",
          data: "0x" 
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log("Boom! Transaction Hash:", data.txHash);
        setAiStatus('monitoring'); 
      } else {
        console.error("Execution Blocked:", data.error);
        alert(`AI Execution Failed: ${data.error}`);
        setAiStatus('opportunity'); 
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Failed to connect to the TREC BitGo Server.");
      setAiStatus('opportunity');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
      
      {/* Top Header Section */}
      <div className="flex items-center justify-between p-6 bg-slate-900/50 border border-white/10 rounded-3xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="text-emerald-400" /> Sky's Trading Agent
          </h2>
          <p className="text-slate-400 text-sm mt-1">ERC-8004 Identity Verified • BitGo MPC Vault Active</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Credit Score</p>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            720
          </p>
        </div>
      </div>

      {/* KYC Verification Section */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
        <button
          type="button"
          onClick={() => setKycExpanded((e) => !e)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="text-emerald-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">KYC & Identity Verification</h3>
              <p className="text-sm text-slate-400">
                {MOCK_KYC.status === 'verified'
                  ? `Verified ${formatRelativeTime(MOCK_KYC.completedAt)} • ${MOCK_KYC.tier}`
                  : 'Complete verification to access borrowing'}
              </p>
            </div>
            <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {MOCK_KYC.status === 'verified' ? 'Verified' : 'Pending'}
            </span>
          </div>
          {kycExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </button>

        {kycExpanded && (
          <div className="border-t border-white/10 p-6 pt-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User size={14} /> Personal information
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <p className="text-slate-500 mb-0.5">Full name</p>
                    <p className="text-white font-medium">{MOCK_KYC.personal.fullName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Date of birth</p>
                    <p className="text-white font-medium">{MOCK_KYC.personal.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Nationality</p>
                    <p className="text-white font-medium">{MOCK_KYC.personal.nationality}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Country of residence</p>
                    <p className="text-white font-medium">{MOCK_KYC.personal.countryOfResidence}</p>
                  </div>
                  <div className="col-span-2 flex items-start gap-2">
                    <MapPin className="text-slate-500 shrink-0 mt-0.5" size={14} />
                    <div>
                      <p className="text-slate-500 mb-0.5">Address</p>
                      <p className="text-white font-medium">
                        {MOCK_KYC.personal.address},<br />
                        {MOCK_KYC.personal.city}, {MOCK_KYC.personal.state} {MOCK_KYC.personal.postalCode}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Email</p>
                    <p className="text-white font-medium">{MOCK_KYC.personal.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Phone</p>
                    <p className="text-white font-medium">{MOCK_KYC.personal.phone}</p>
                  </div>
                </div>
              </div>

              {/* Identity document & verification steps */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <FileText size={14} /> Identity document
                  </h4>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Type</span>
                      <span className="text-white font-medium">{MOCK_KYC.identity.documentType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Number</span>
                      <span className="text-white font-mono">{MOCK_KYC.identity.documentNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Issuing country</span>
                      <span className="text-white font-medium">{MOCK_KYC.identity.issuingCountry}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Expiry</span>
                      <span className="text-white font-medium">{MOCK_KYC.identity.expiryDate}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <CreditCard size={14} /> Verification checklist
                  </h4>
                  <ul className="space-y-2">
                    {MOCK_KYC.verificationSteps.map((step) => (
                      <li
                        key={step.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        {step.done ? (
                          <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-500 shrink-0" />
                        )}
                        <span className={step.done ? 'text-slate-300' : 'text-slate-500'}>{step.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              KYC data is held securely and used only for compliance. Last refreshed: {formatRelativeTime(MOCK_KYC.completedAt)}.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: The Collateral & Borrow Setup */}
        <div className="p-6 bg-slate-900/80 border border-white/10 rounded-3xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">1. Request Capital</h3>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Amount to Borrow (USDC)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input 
                  type="number" 
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-8 pr-4 text-white text-xl font-medium focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Risk Tier</span>
                <span className="text-white font-medium">
                  {Number(borrowAmount) <= 1000 ? 'Standard (Flat Fee)' : 'Whale (12% Dynamic)'}
                </span>
              </div>
              <div className="h-px w-full bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Required Collateral</span>
                <span className="text-xl font-bold text-yellow-400">${collateralRequired.toLocaleString()}</span>
              </div>
            </div>

            <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-white font-bold transition-opacity flex justify-center items-center gap-2">
              <Zap size={18} /> Stake Bond & Fund AI Vault
            </button>
          </div>
        </div>

        {/* Right Column: The Proactive AI Terminal */}
        <div className="flex flex-col h-full bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="p-4 border-b border-white/10 bg-slate-900/50 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-slate-300">TREC Sentinel Terminal</span>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
            
            {aiStatus === 'scanning' && (
              <div className="text-center space-y-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                  <Bot className="text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm">Scanning verified protocols for optimal yield...</p>
              </div>
            )}

            {aiStatus === 'opportunity' && (
              <div className="bg-slate-900 border border-blue-500/30 p-5 rounded-2xl animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex gap-3 mb-3">
                  <AlertTriangle className="text-blue-400" />
                  <h4 className="font-bold text-white">High Yield Opportunity Detected</h4>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  I found an opportunity on the <strong className="text-white">Uniswap V3 USDC/ETH Pool</strong> yielding 12.4% APY. 
                  Target contract is verified by TREC Risk Engine.
                </p>
                <div className="p-3 bg-black/50 rounded-xl mb-4 border border-white/5 text-sm font-mono text-slate-400">
                  Payload: 0x3fC9...FAD<br/>
                  Action: Provide Liquidity<br/>
                  Amount: ${borrowAmount || 0}
                </div>
                <button 
                  onClick={handleApproveTrade}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Approve Transaction <ArrowRight size={16} />
                </button>
              </div>
            )}

            {aiStatus === 'executing' && (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-emerald-500 animate-spin mx-auto" />
                <p className="text-emerald-400 text-sm font-medium">BitGo MPC Wallet Signing Transaction...</p>
              </div>
            )}

            {aiStatus === 'monitoring' && (
              <div className="text-center space-y-3 animate-in zoom-in duration-500">
                <CheckCircle2 className="text-emerald-500 mx-auto w-16 h-16" />
                <h3 className="text-xl font-bold text-white">Capital Deployed</h3>
                <p className="text-slate-400 text-sm">
                  Sentinel Agent is now actively monitoring your position via Chainlink Price Feeds. 
                  Emergency 10% Stop-Loss is active.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}