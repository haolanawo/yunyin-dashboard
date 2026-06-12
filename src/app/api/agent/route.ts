import { NextResponse } from 'next/server';
import { readMemoryStore } from '@/features/agent/memory/localMemoryStore';
import { runContentStrategyAgent } from '@/features/agent/orchestrator';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('history') === '1') {
    const history = await readMemoryStore();
    return NextResponse.json(history.slice(0, 20));
  }

  return NextResponse.json({ error: 'Unsupported GET request.' }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string; userId?: string; context?: Record<string, unknown> };
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    const result = await runContentStrategyAgent({
      question,
      userId: body.userId,
      context: body.context,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Agent execution failed.' },
      { status: 500 },
    );
  }
}
