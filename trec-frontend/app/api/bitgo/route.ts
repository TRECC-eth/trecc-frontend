import { NextResponse } from 'next/server';
import { BitGo } from 'bitgo';

// ---------------------------------------------------------
// THE TREC RISK ENGINE (OVERWATCH AI)
// ---------------------------------------------------------
const APPROVED_PROTOCOLS = [
  "0x173b126de51f353a0c7bbb38035f5796da41c529", // Mock USDC
  "0x64d02fa756d452b3022e8637aa3fe47b914bd31c", // TREC Vault
  "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD"  // Uniswap V3 Router (Sepolia)
].map(addr => addr.toLowerCase());

export async function POST(req: Request) {
  try {
    // --- 0. BITGO CONFIG (what you need to make it work) ---
    const accessToken = process.env.BITGO_ACCESS_TOKEN;
    const walletId = process.env.BITGO_WALLET_ID;
    const walletPassphrase = process.env.BITGO_WALLET_PASSPHRASE;
    if (!accessToken || !walletId || !walletPassphrase) {
      return NextResponse.json(
        {
          success: false,
          error: "BitGo is not configured. Set BITGO_ACCESS_TOKEN, BITGO_WALLET_ID, and BITGO_WALLET_PASSPHRASE in .env (see BITGO_NEEDED.md).",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { to, value, data } = body;

    if (!to) {
      return NextResponse.json({ error: "Missing transaction parameters (to required)" }, { status: 400 });
    }

    // --- 1. AI RISK ASSESSMENT ---
    console.log(`TREC Risk Engine evaluating target contract: ${to}`);
    if (!APPROVED_PROTOCOLS.includes(to.toLowerCase())) {
      console.error(`🚨 SECURITY ALERT: Attempted to interact with unverified contract: ${to}`);
      return NextResponse.json({ 
        success: false, 
        error: "TREC Risk AI blocked this transaction. Target is not a verified Tier-1 protocol." 
      }, { status: 403 });
    }
    
    // --- 2. BITGO MPC EXECUTION ---
    const bitgo = new BitGo({ env: 'test' });
    bitgo.authenticateWithAccessToken({ accessToken });
    const wallet = await bitgo.coin('teth').wallets().get({ id: walletId });

    console.log("Elsa is executing transaction via BitGo MPC...");

    const txData = data ?? '0x';
    const transaction = await wallet.send({
      address: to,
      amount: value || '0',
      type: 'contractCall',
      data: txData,
      walletPassphrase,
    });

    return NextResponse.json({ 
      success: true, 
      txHash: transaction.txid,
      message: "Transaction verified by TREC Risk Engine and executed by BitGo."
    });

  } catch (error: any) {
    console.error("BitGo Execution Error:", error.message || error);
    return NextResponse.json({ success: false, error: error.message || 'Execution failed.' }, { status: 500 });
  }
}