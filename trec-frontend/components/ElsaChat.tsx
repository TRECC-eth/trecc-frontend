'use client';

import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useAccount, useSendTransaction } from 'wagmi';
import { encodeFunctionData, parseUnits } from 'viem';

// IMPORTANT: Double-check these paths match where you saved your files!
import { VAULT_ABI } from '../constants/abi/vaultAbi';

import { TREC_VAULT_ADDRESS } from '../constants/addresses';

interface Message {
  id: string;
  role: 'user' | 'elsa' | 'system';
  content: string;
}

export default function ElsaChat() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'elsa',
      content: "Hello Sky. I am Elsa, your TREC-enabled DeFi Agent. Your current credit score is 500. How can I deploy your capital today?",
    }
  ]);

  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !address) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    // 1. Add User Message to UI instantly
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: userText }]);

    try {
      // 2. MOCK THE NETWORK DELAY (Makes it look like the AI is "thinking")
      await new Promise(resolve => setTimeout(resolve, 1800));

      let mockApiResponse: any = {};

      // 3. THE INTENT PARSER (Look for keywords in the user's text)
      if (userText.toLowerCase().includes("borrow")) {
        
        // Encode the exact smart contract call to your Vault!
        const encodedData = encodeFunctionData({
          abi: VAULT_ABI,
          functionName: 'issueLoan', // <-- Updated to match your real contract
          // issueLoan expects: [_borrower, _bitGoWallet, _loanAmount]
          args: [
            address as `0x${string}`, // 1. Sky's wallet (The Borrower)
            address as `0x${string}`, // 2. Faking the BitGo wallet as Sky's wallet for the demo
            parseUnits('50', 18)      // 3. 50 USDC
          ] 
        });
        
        mockApiResponse = {
          transactionPayload: {
            to: TREC_VAULT_ADDRESS as `0x${string}`,
            value: BigInt(0),
            data: encodedData
          }
        };

      } else if (userText.toLowerCase().includes("balance")) {
        mockApiResponse = { reply: "Your current agent balance is 0 USDC. Your credit score is 500. You are eligible to borrow." };
      } else {
        mockApiResponse = { reply: "I am ready to deploy capital. Try asking me to 'Borrow 50 USDC'." };
      }

      // 4. PROCESS THE MOCK RESPONSE
      if (mockApiResponse.transactionPayload) {
        setMessages((prev) => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'elsa', 
          content: `Intent recognized. I have prepared the transaction to borrow USDC from the TREC Vault. Please sign the execution in your wallet.` 
        }]);

        // Trigger MetaMask with the mock payload!
        const txHash = await sendTransactionAsync({
          to: mockApiResponse.transactionPayload.to,
          value: mockApiResponse.transactionPayload.value,
          data: mockApiResponse.transactionPayload.data,
        });

        setMessages((prev) => [...prev, { 
          id: (Date.now() + 2).toString(), 
          role: 'system', 
          content: `Transaction Confirmed on Base Sepolia! Hash: ${txHash}` 
        }]);

      } else {
        setMessages((prev) => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'elsa', 
          content: mockApiResponse.reply 
        }]);
      }

    } catch (error) {
      console.error("Transaction Error:", error);
      setMessages((prev) => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'system', 
        content: "User rejected the transaction or execution failed." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col h-[550px]">
      
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-white/5">
        <div className="bg-white/5 p-2 rounded-xl border border-white/10">
          <Bot className="text-slate-200" size={20} />
        </div>
        <div>
          <h2 className="text-white font-semibold">Elsa AI Co-Pilot</h2>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
            Intent Engine Active
          </p>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
              msg.role === 'elsa' ? 'bg-white/5 border border-white/10 text-slate-200' : 
              msg.role === 'system' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
              'bg-neutral-800 text-slate-300'
            }`}>
              {msg.role === 'elsa' ? <Sparkles size={16} /> : msg.role === 'system' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' ? 'bg-white text-black rounded-tr-none font-medium' : 
              msg.role === 'system' ? 'bg-emerald-950/30 text-emerald-200 border border-emerald-500/10' :
              'bg-neutral-900/80 text-slate-300 border border-white/5 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-200 flex items-center justify-center">
                <Loader2 className="animate-spin" size={16} />
             </div>
             <div className="bg-neutral-900/80 text-slate-400 border border-white/5 rounded-2xl rounded-tl-none px-5 py-3 text-sm flex items-center gap-2">
                Analyzing intent and routing via Base Sepolia...
             </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-black/40 border-t border-white/5">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!address || isLoading}
            placeholder={address ? "e.g., Borrow 50 USDC from TRECVault..." : "Connect wallet to chat..."}
            className="w-full bg-neutral-900/50 border border-white/10 text-white placeholder-slate-600 text-sm rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!input.trim() || !address || isLoading}
            className="absolute right-2 p-2.5 bg-white hover:bg-slate-200 disabled:bg-neutral-800 disabled:text-neutral-600 text-black rounded-full transition-colors shadow-[0_0_10px_rgba(255,255,255,0.1)]"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}