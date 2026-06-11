import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set([
  'i0.hdslb.com',
  'i1.hdslb.com',
  'i2.hdslb.com',
  'archive.biliimg.com',
]);

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'missing_url' }, { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
  }

  if (imageUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(imageUrl.hostname)) {
    return NextResponse.json({ error: 'image_host_not_allowed' }, { status: 403 });
  }

  const upstream = await fetch(imageUrl, {
    headers: {
      Referer: 'https://www.bilibili.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'image_fetch_failed' }, { status: upstream.status || 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
    },
  });
}
