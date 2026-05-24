import { NextResponse } from 'next/server';

const DEFAULT_AGENT_API_URL = 'http://localhost:3001/api/agents';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
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
