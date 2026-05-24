const STORAGE_KEY_PREFIX = 'trecc:agent-dashboard:';

export function getAgentDashboardAccess(address?: string) {
  if (typeof window === 'undefined' || !address) return false;
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${address.toLowerCase()}`) === 'true';
}

export function setAgentDashboardAccess(address?: string) {
  if (typeof window === 'undefined' || !address) return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${address.toLowerCase()}`, 'true');
}
