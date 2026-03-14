const STORAGE_KEY_PREFIX = 'trecc_ens_';

export function getStoredTreccUsername(address: string | undefined): string | null {
  if (!address) return null;
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${address.toLowerCase()}`);
}

export function setStoredTreccUsername(address: string | undefined, label: string): void {
  if (!address) return;
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${address.toLowerCase()}`, label);
}
