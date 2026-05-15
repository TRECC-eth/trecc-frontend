const STORAGE_KEY_PREFIX = 'trecc:lender-dashboard:';

export function getLenderDashboardAccess(address?: string) {
  if (typeof window === 'undefined' || !address) return false;
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${address.toLowerCase()}`) === 'true';
}

export function setLenderDashboardAccess(address?: string) {
  if (typeof window === 'undefined' || !address) return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${address.toLowerCase()}`, 'true');
}
