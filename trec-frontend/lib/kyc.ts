import { getSupabaseHeaders, supabaseRestUrl } from './supabase';

export interface KycPayload {
  wallet_address: string;
  full_name: string;
  email: string;
  date_of_birth: string;
  country: string;
  id_type: string;
  id_number: string;
}

export async function submitKyc(payload: KycPayload) {
  const response = await fetch(
    supabaseRestUrl('kyc_submissions', 'on_conflict=wallet_address'),
    {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([
        {
          wallet_address: payload.wallet_address.toLowerCase(),
          full_name: payload.full_name.trim(),
          email: payload.email.trim().toLowerCase(),
          date_of_birth: payload.date_of_birth,
          country: payload.country,
          id_type: payload.id_type,
          id_number: payload.id_number.trim(),
          status: 'pending',
        },
      ]),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText || 'Failed to submit KYC.';
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || parsed.error || parsed.hint || message;
    } catch {}
    throw new Error(message);
  }
}

export async function getKycStatus(walletAddress: string): Promise<string | null> {
  const query = `wallet_address=eq.${walletAddress.toLowerCase()}&select=status`;
  const response = await fetch(supabaseRestUrl('kyc_submissions', query), {
    method: 'GET',
    headers: getSupabaseHeaders(),
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (data.length === 0) return null;
  return data[0].status;
}
