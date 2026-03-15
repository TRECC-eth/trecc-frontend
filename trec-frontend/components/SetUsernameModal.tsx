'use client';

import React, { useState, useCallback } from 'react';
import { X, Loader2, AtSign, CheckCircle, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { TRECC_ENS_PARENT } from '../constants/ens';
import { setStoredTreccUsername } from '../lib/ens-storage';

/** Normalize label: lowercase, only a-z 0-9 and hyphen; max length 63. */
function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 63);
}

interface SetUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (label: string) => void;
}

export default function SetUsernameModal({ isOpen, onClose, onSuccess }: SetUsernameModalProps) {
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const { address } = useAccount();

  const normalizedLabel = normalizeLabel(label);
  const subname = normalizedLabel ? `${normalizedLabel}.${TRECC_ENS_PARENT}` : '';

  const handleSubmit = useCallback(async () => {
    if (!address) {
      setError('Connect your wallet first.');
      return;
    }
    if (!normalizedLabel || normalizedLabel.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, hyphens only).');
      return;
    }

    setError(null);
    setTxHash(null);
    setEnsName(null);
    setIsPending(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 70_000); // 70s so server 60s timeout can complete first

    try {
      const res = await fetch('/api/ens/register-subname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedLabel, ownerAddress: address }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = (await res.json()) as {
        txHash?: string;
        ensName?: string;
        error?: string;
        details?: string;
        hint?: string;
        code?: string;
      };

      if (!res.ok) {
        const code = data.code as string | undefined;
        let userMessage: string;
        if (res.status === 501) {
          userMessage =
            'Subname registration is not available right now. Please try again later or contact support.';
        } else if (code === 'RPC_TIMEOUT' || res.status === 504) {
          userMessage =
            data.details ||
            'Registration is taking too long. Your subname may still have been created — check app.ens.dev/trecc.eth or try again.';
        } else {
          userMessage = data.details || data.error || `Request failed (${res.status})`;
        }
        const hint = res.status !== 501 && data.hint ? ` — ${data.hint}` : '';
        setError(`${userMessage}${hint}`);
        return;
      }

      if (data.txHash && data.ensName) {
        setTxHash(data.txHash);
        setEnsName(data.ensName);
        setStoredTreccUsername(address, normalizedLabel);
        onSuccess?.(normalizedLabel);
      }
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === 'AbortError') {
        setError(
          'Registration is taking too long. Your subname may still have been created — check app.ens.dev/trecc.eth or try again.'
        );
      } else {
        setError(e instanceof Error ? e.message : 'Network error — please try again.');
      }
    } finally {
      setIsPending(false);
    }
  }, [address, normalizedLabel, onSuccess]);

  const handleClose = () => {
    setLabel('');
    setError(null);
    setTxHash(null);
    setEnsName(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden
        onClick={handleClose}
      />
      <div
        className="relative w-full max-w-md rounded-[2rem] p-6
          bg-[linear-gradient(160deg,#242429_0%,#0c0c0e_40%,#000000_50%,#0f0f13_60%,#1e1e24_100%)]
          border border-white/[0.1] border-t-white/[0.25] border-b-black
          shadow-[0_30px_60px_-15px_rgba(0,0,0,1),inset_0_2px_4px_rgba(255,255,255,0.08),inset_0_-4px_8px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-labelledby="set-username-title"
        aria-modal="true"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent h-[45%] rounded-[2rem] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-6">
          <h2
            id="set-username-title"
            className="text-xl font-medium text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#999999_100%)] tracking-tight flex items-center gap-2"
          >
            <AtSign className="w-5 h-5 text-zinc-300 shrink-0" />
            Set your TRECC username
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors duration-300"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {txHash && ensName ? (
          <div className="relative z-10 space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-black/40 border border-white/[0.08] p-4">
              <CheckCircle className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-zinc-300 font-medium text-sm">Subname registered!</p>
                <p className="text-white font-mono text-sm">{ensName}</p>
              </div>
            </div>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors duration-300"
            >
              View transaction <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-white font-medium transition-all duration-300"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="relative z-10 text-zinc-500 text-sm mb-4 font-light">
              Claim a free subname under{' '}
              <span className="text-white font-medium">{TRECC_ENS_PARENT}</span>.
              You&apos;ll get a name like{' '}
              <span className="text-zinc-300 font-medium">username.trecc.eth</span>.
            </p>

            <div className="relative z-10 space-y-2 mb-4">
              <label htmlFor="ens-label" className="block text-sm font-medium text-zinc-400">
                Username
              </label>
              <input
                id="ens-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isPending && handleSubmit()}
                placeholder="e.g. rahul"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/[0.1] text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-colors duration-300"
                autoComplete="username"
                disabled={isPending}
              />
              {subname && (
                <p className="text-sm text-zinc-500">
                  You&apos;ll get:{' '}
                  <span className="text-zinc-300 font-mono">{subname}</span>
                </p>
              )}
            </div>

            {error && (
              <p className="relative z-10 text-red-400 text-sm mb-4 wrap-break-word" role="alert">
                {error}
              </p>
            )}

            <div className="relative z-10 flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !normalizedLabel || normalizedLabel.length < 3 || !address}
                className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] disabled:opacity-50 disabled:pointer-events-none text-white font-medium flex items-center justify-center gap-2 transition-all duration-300"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering…
                  </>
                ) : (
                  'Claim subname'
                )}
              </button>
            </div>
          </>
        )}

        <p className="relative z-10 text-zinc-500 text-xs mt-4 font-light">
          Registration is on <strong className="text-zinc-400">Sepolia</strong>. After claiming, view your subname at{' '}
          <a
            href="https://app.ens.dev/trecc.eth"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-200 hover:underline transition-colors duration-300"
          >
            app.ens.dev/trecc.eth
          </a>{' '}
          — the mainnet ENS dashboard will not show Sepolia subnames.
        </p>
      </div>
    </div>
  );
}
