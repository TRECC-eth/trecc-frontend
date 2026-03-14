import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/[0.05] bg-[#050505] pt-8 pb-6 px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Top Row: Brand & Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand & Copyright */}
          <div className="flex flex-col items-center md:items-start">
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-300">
              TRECC © {new Date().getFullYear()}
            </span>
            <span className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider">
              All rights reserved.
            </span>
          </div>

          {/* Minimalist Links */}
          <div className="flex flex-wrap justify-center items-center gap-6">
            <Link 
              href="#docs" 
              className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Docs
            </Link>
            <Link 
              href="#github" 
              className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              GitHub
            </Link>
            <Link 
              href="#contracts" 
              className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Contracts
            </Link>
            <Link 
              href="#terms" 
              className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Ultra-light divider line */}
        <div className="w-full h-px bg-white/[0.03]" />

        {/* Bottom Row: Testnet Disclaimer */}
        <div className="flex justify-center text-center md:text-left md:justify-start">
          <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-zinc-500/70">
            Notice: Protocol is currently deployed on testnet environments only. Smart contracts are unaudited.
          </span>
        </div>

      </div>
    </footer>
  );
}