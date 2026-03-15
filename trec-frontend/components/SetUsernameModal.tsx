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
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl"
        role="dialog"
        aria-labelledby="set-username-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            id="set-username-title"
            className="text-xl font-semibold text-white flex items-center gap-2"
          >
            <AtSign className="w-5 h-5 text-emerald-400" />
            Set your TRECC username
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {txHash && ensName ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-emerald-300 font-medium text-sm">Subname registered!</p>
                <p className="text-white font-mono text-sm">{ensName}</p>
              </div>
            </div>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
            >
              View transaction <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-4">
              Claim a free subname under{' '}
              <span className="text-white font-medium">{TRECC_ENS_PARENT}</span>.
              You&apos;ll get a name like{' '}
              <span className="text-emerald-400 font-medium">username.trecc.eth</span>.
            </p>

            <div className="space-y-2 mb-4">
              <label htmlFor="ens-label" className="block text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                id="ens-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isPending && handleSubmit()}
                placeholder="e.g. rahul"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                autoComplete="username"
                disabled={isPending}
              />
              {subname && (
                <p className="text-sm text-slate-500">
                  You&apos;ll get:{' '}
                  <span className="text-emerald-400 font-mono">{subname}</span>
                </p>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4 wrap-break-word" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !normalizedLabel || normalizedLabel.length < 3 || !address}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white font-medium flex items-center justify-center gap-2 transition-colors"
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

        <p className="text-slate-500 text-xs mt-4">
          Registration is on <strong>Sepolia</strong>. After claiming, view your subname at{' '}
          <a
            href="https://app.ens.dev/trecc.eth"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            app.ens.dev/trecc.eth
          </a>{' '}
          — the mainnet ENS dashboard will not show Sepolia subnames.
        </p>
      </div>
    </div>
  );
}
