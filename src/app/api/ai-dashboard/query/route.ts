import { NextRequest, NextResponse } from 'next/server';
import { executeAiDashboardQuery } from '@/features/ai-dashboard/server/queryService';
import type { AiDataSource } from '@/features/ai-dashboard/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { dataSourceId: AiDataSource['id']; sql: string };
    const data = await executeAiDashboardQuery(body.dataSourceId, body.sql);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to execute query.' },
      { status: 400 },
    );
  }
}
