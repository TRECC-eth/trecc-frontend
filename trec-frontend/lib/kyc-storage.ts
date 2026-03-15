const STORAGE_KEY_PREFIX = 'trecc_kyc_';

export type KycStatus = 'pending' | 'verified';

export function getStoredKycStatus(address: string | undefined): KycStatus | null {
  if (!address) return null;
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${address.toLowerCase()}`);
  if (raw === 'verified' || raw === 'pending') return raw;
  return null;
}

export function setStoredKycStatus(address: string | undefined, status: KycStatus): void {
  if (!address) return;
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${address.toLowerCase()}`, status);
}

export function isKycVerified(address: string | undefined): boolean {
  return getStoredKycStatus(address) === 'verified';
}
