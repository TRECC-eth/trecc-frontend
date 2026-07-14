import { NextResponse } from 'next/server';

const DEFAULT_AGENT_API_URL = 'http://localhost:3001/api/agents';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // 🟢 DEMO MODE TOGGLE: Set to true for the video recording
    // This entirely bypasses the localhost backend fetch.
    const DEMO_MODE = true;

    if (DEMO_MODE) {
      // Fake a 1.5-second network delay so the UI loading spinner looks real
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return a mocked success response
      return NextResponse.json({
        success: true,
        message: "Agent created successfully (DEMO)",
        agent: {
          id: `demo_agent_${Math.random().toString(36).substr(2, 9)}`,
          status: "active",
          createdAt: new Date().toISOString(),
          ...payload // Echoes back whatever the frontend sent
        }
      }, { status: 200 });
    }

    // --- REAL LOGIC BELOW (ignored while DEMO_MODE is true) ---
    const agentApiUrl = process.env.TRECC_AGENT_API_URL || process.env.NEXT_PUBLIC_TRECC_AGENT_API_URL || DEFAULT_AGENT_API_URL;

    const response = await fetch(agentApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || 'Agent backend rejected the request.',
          details: data?.details,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to create agent.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}