import { NextRequest, NextResponse } from 'next/server';
import {
  createSavedView,
  deleteSavedView,
  listSavedViews,
  renameSavedView,
} from '@/features/ai-dashboard/server/savedViewsRepository';
import type { AiDataSource, GeneratedViewDraft } from '@/features/ai-dashboard/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const views = await listSavedViews();
    return NextResponse.json({ views });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load saved views.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      dataSourceId: AiDataSource['id'];
      selectedTables: string[];
      draft: GeneratedViewDraft;
    };

    const view = await createSavedView(body);
    return NextResponse.json({ view });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save view.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { id?: string; title?: string };
    const id = body.id?.trim();
    const title = body.title?.trim();

    if (!id || !title) {
      return NextResponse.json({ error: 'View id and title are required.' }, { status: 400 });
    }

    const view = await renameSavedView(id, title);
    return NextResponse.json({ view });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update saved view.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')?.trim();

    if (!id) {
      return NextResponse.json({ error: 'View id is required.' }, { status: 400 });
    }

    await deleteSavedView(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete saved view.' },
      { status: 500 },
    );
  }
}
