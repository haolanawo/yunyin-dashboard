import { NextResponse } from 'next/server';
import { listAiDataSources, listTableSchemasForSource } from '@/features/ai-dashboard/server/dataSources';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dataSources = await listAiDataSources();
    const defaultSource = dataSources.find((source) => source.available) ?? dataSources[0];
    const tables = defaultSource ? await listTableSchemasForSource(defaultSource.id) : [];
    return NextResponse.json({ dataSources, tables });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load AI dashboard metadata.' },
      { status: 500 },
    );
  }
}
