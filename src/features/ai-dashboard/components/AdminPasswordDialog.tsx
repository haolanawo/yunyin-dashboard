'use client';

import { useState } from 'react';

export function AdminPasswordDialog({
  open,
  onClose,
  onVerified,
}: {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-dashboard/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await response.json();
      if (json.success) {
        localStorage.setItem('ai_dashboard_admin_password', password);
        onVerified();
      } else {
        setError(json.error ?? '管理员密码错误');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">管理员验证</h3>
        <p className="mt-2 text-sm text-gray-500">保存 AI 视图前请输入管理员密码。</p>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          placeholder="管理员密码"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || !password.trim()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? '验证中...' : '验证'}
          </button>
        </div>
      </div>
    </div>
  );
}
