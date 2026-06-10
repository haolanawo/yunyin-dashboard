// ============================================================
// 首页 — 自动跳转到 /dashboard
// ============================================================

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
