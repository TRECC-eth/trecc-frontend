import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';

// 1. Added TypeScript interface for the props to prevent Vercel errors
interface BetaGateProps {
  children: React.ReactNode;
}

export default function BetaGate({ children }: BetaGateProps) {
  const [accessCode, setAccessCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  // The secret code you give to your VCs and beta testers
  const SECRET_CODE = "treccbeta5099"; 

  // 2. Added TypeScript type for the form event
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (accessCode === SECRET_CODE) {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setAccessCode('');
    }
  };

  if (isAuthenticated) {
    // If authenticated, render the app normally (navbar included)
    return <>{children}</>;
  }

  // If NOT authenticated, render a full-screen overlay that hides the navbar
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black px-4">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* TRECC Security Card */}
      <div className="
        relative z-10 w-full max-w-md p-8 md:p-10 rounded-[2rem]
        bg-[linear-gradient(160deg,#1a1a1f_0%,#0c0c0e_40%,#000000_50%,#0f0f13_60%,#1e1e24_100%)]
        border border-white/[0.08] border-t-white/[0.15]
        shadow-[0_30px_60px_-15px_rgba(0,0,0,1),inset_0_2px_4px_rgba(255,255,255,0.05)]
      ">
        
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-black border border-white/[0.05] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
          <Lock className="text-zinc-400" size={20} strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-medium mb-2 text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#8c8c8c_100%)] tracking-tight">
          Restricted Access
        </h1>
        <p className="text-zinc-500 mb-8 font-light text-sm tracking-wide leading-relaxed">
          The TRECC prime brokerage protocol is currently in private beta. Please authenticate to establish a secure session.
        </p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="relative">
            <input 
              type="password" 
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value);
                setError(false);
              }}
              className={`
                w-full px-5 py-4 bg-black/50 border rounded-xl text-white placeholder:text-zinc-600 
                focus:outline-none transition-colors backdrop-blur-sm
                ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.1] focus:border-white/[0.3]'}
              `}
              placeholder="Enter authorization code..."
            />
            {error && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 flex items-center gap-1">
                <ShieldAlert size={16} />
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="
              group w-full px-5 py-4 mt-2 rounded-xl font-medium text-sm tracking-wide
              bg-white text-black hover:bg-zinc-200 
              transition-all duration-300 flex items-center justify-center gap-2
            "
          >
            INITIALIZE SESSION
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </form>

      </div>
    </div>
  );
}