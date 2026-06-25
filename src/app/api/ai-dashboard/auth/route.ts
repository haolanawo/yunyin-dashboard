import { NextRequest, NextResponse } from 'next/server';
import { getAdminPassword } from '@/features/ai-dashboard/server/aiConfigProvider';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { password?: string };
  return NextResponse.json({
    success: body.password === getAdminPassword(),
    error: body.password === getAdminPassword() ? null : '管理员密码错误',
  });
}
