import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const CHAINLINK_ABI = [
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      { "internalType": "uint80", "name": "roundId", "type": "uint80" },
      { "internalType": "int256", "name": "answer", "type": "int256" },
      { "internalType": "uint256", "name": "startedAt", "type": "uint256" },
      { "internalType": "uint256", "name": "updatedAt", "type": "uint256" },
      { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Base Sepolia Chainlink ETH/USD Price Feed Address
const CHAINLINK_ETH_USD_BASE_SEPOLIA = '0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1';

// We assume the AI entered the position when ETH was at this price
const ENTRY_PRICE = 3000; 
const DANGER_THRESHOLD = ENTRY_PRICE * 0.90; // 10% Drop ($2,700)

export async function GET() {
  try {
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    const roundData = await publicClient.readContract({
      address: CHAINLINK_ETH_USD_BASE_SEPOLIA,
      abi: CHAINLINK_ABI,
      functionName: 'latestRoundData',
    });

    // Chainlink returns 8 decimals
    const livePrice = Number(roundData[1]) / 100000000;
    
    let actionTaken = "none";
    let status = "healthy";

    if (livePrice <= DANGER_THRESHOLD) {
      status = "danger";
      actionTaken = "EMERGENCY_WITHDRAWAL_TRIGGERED";
    }

    return NextResponse.json({
      success: true,
      agent: "Sentinel-1",
      currentPrice: livePrice,
      threshold: DANGER_THRESHOLD,
      status: status,
      action: actionTaken
    });

  } catch (error: any) {
    console.error("Sentinel Error:", error);
    return NextResponse.json({ success: false, error: "Chainlink Oracle failure." }, { status: 500 });
  }
}