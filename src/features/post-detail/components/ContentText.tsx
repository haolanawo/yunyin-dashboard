// ============================================================
// ContentText — 正文展示（可折叠）
// ============================================================

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface ContentTextProps {
  text: string | null;
}

export default function ContentText({ text }: ContentTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">正文内容</h2>
        <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
          <FileText size={16} />
          <p className="text-sm">暂无正文数据</p>
        </div>
      </div>
    );
  }

  const preview = text.slice(0, 500);
  const hasMore = text.length > 500;

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4">正文内容</h2>
      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {expanded || !hasMore ? text : `${preview}...`}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} />
              收起
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              展开全文 ({text.length} 字)
            </>
          )}
        </button>
      )}
    </div>
  );
}
