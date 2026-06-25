import { NextRequest, NextResponse } from 'next/server';
import { listTableSchemasForSource } from '@/features/ai-dashboard/server/dataSources';
import { generateAiView } from '@/features/ai-dashboard/server/generateView';
import type { AiDataSource } from '@/features/ai-dashboard/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      dataSourceId: AiDataSource['id'];
      selectedTables: string[];
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!body.selectedTables?.length) {
      return NextResponse.json({ error: 'Please select at least one table.' }, { status: 400 });
    }

    const schemas = await listTableSchemasForSource(body.dataSourceId);
    const result = await generateAiView({
      dataSourceId: body.dataSourceId,
      selectedTables: body.selectedTables,
      schemas,
      messages: body.messages,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate AI view.' },
      { status: 500 },
    );
  }
}
