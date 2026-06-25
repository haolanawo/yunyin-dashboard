'use client';

import { Activity, BarChart3, FileText, MousePointerClick, Percent, Target, ThumbsUp, Users } from 'lucide-react';
import { useExecutiveOverview, type PlatformOverview } from '@/features/dashboard/hooks/useDashboardData';

function formatNumber(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return Math.round(n).toLocaleString('zh-CN');
}

function formatDecimal(value: number, digits = 1): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toFixed(digits);
}

function formatPercent(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return `${(n * 100).toFixed(1)}%`;
}

interface MetricCardProps {
  label: string;
  value: string;
  note: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  isLoading: boolean;
}

function MetricCard({ label, value, note, icon: Icon, color, isLoading }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500">{label}</span>
        <Icon size={19} className={color} />
      </div>
      <div className="min-h-9 text-3xl font-semibold tracking-normal text-gray-950">
        {isLoading ? '加载中' : value}
      </div>
      <div className="mt-2 min-h-4 text-xs leading-5 text-gray-500">{isLoading ? '正在汇总经营数据' : note}</div>
    </div>
  );
}

function PlatformRow({ item }: { item: PlatformOverview }) {
  const activityLabel = item.platform === 'bilibili' ? '互动率' : '评论/点赞';
  const activityValue = item.platform === 'bilibili' ? formatPercent(item.interactionRate) : formatPercent(item.commentRate);
  const viewsText = item.platform === 'bilibili' ? formatNumber(item.views) : '未采集';

  return (
    <div className="grid grid-cols-12 items-center gap-3 border-b border-gray-100 px-1 py-3 last:border-0">
      <div className="col-span-2 min-w-0">
        <div className="text-sm font-semibold text-gray-900">{item.label}</div>
        <div className="mt-0.5 text-xs text-gray-500">{item.accounts} 个账号</div>
      </div>
      <div className="col-span-2 text-right">
        <div className="text-sm font-semibold text-gray-900">{formatNumber(item.contents)}</div>
        <div className="text-xs text-gray-500">内容 {formatPercent(item.contentShare)}</div>
      </div>
      <div className="col-span-2 text-right">
        <div className="text-sm font-semibold text-gray-900">{viewsText}</div>
        <div className="text-xs text-gray-500">浏览/播放</div>
      </div>
      <div className="col-span-2 text-right">
        <div className="text-sm font-semibold text-gray-900">{formatNumber(item.interactions)}</div>
        <div className="text-xs text-gray-500">互动 {formatPercent(item.interactionShare)}</div>
      </div>
      <div className="col-span-2 text-right">
        <div className="text-sm font-semibold text-gray-900">{formatDecimal(item.avgInteractionPerContent)}</div>
        <div className="text-xs text-gray-500">单篇互动</div>
      </div>
      <div className="col-span-2 text-right">
        <div className="text-sm font-semibold text-gray-900">{activityValue}</div>
        <div className="text-xs text-gray-500">{activityLabel}</div>
      </div>
    </div>
  );
}

export default function SummaryStats() {
  const { data: payload, isLoading, isError, error } = useExecutiveOverview();
  const data = payload?.data;

  if (isError) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        经营总览加载失败：{error?.message ?? '未知错误'}
      </div>
    );
  }

  const cards = [
    {
      label: '内容资产总量',
      value: formatNumber(data?.contentCount ?? 0),
      note: `${data?.accountCount ?? 0} 个账号，平均每账号 ${formatDecimal(data?.contentPerAccount ?? 0)} 篇`,
      icon: FileText,
      color: 'text-emerald-600',
    },
    {
      label: '累计互动总量',
      value: formatNumber(data?.totalInteractions ?? 0),
      note: `点赞 ${formatNumber(data?.totalLikes ?? 0)}，评论 ${formatNumber(data?.totalComments ?? 0)}`,
      icon: ThumbsUp,
      color: 'text-amber-600',
    },
    {
      label: '单篇互动效率',
      value: formatDecimal(data?.avgInteractionPerContent ?? 0),
      note: '总互动 / 内容数，衡量内容资产平均产出',
      icon: Target,
      color: 'text-blue-600',
    },
    {
      label: '播放互动率',
      value: formatPercent(data?.interactionRate ?? 0),
      note: `B站播放 ${formatNumber(data?.totalViews ?? 0)}，知乎暂未采集浏览`,
      icon: Percent,
      color: 'text-pink-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gray-900">
              <BarChart3 size={20} className="text-brand-500" />
              <h2 className="text-base font-semibold">经营驾驶舱</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              同时看总量和效率：内容池有多大、互动有多少、单篇产出怎么样、哪个平台贡献更高。
            </p>
          </div>
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="rounded-md bg-gray-50 px-2 py-1">平台 {data?.platformCount ?? 0}</span>
            <span className="rounded-md bg-gray-50 px-2 py-1">账号 {data?.accountCount ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} isLoading={isLoading} />
        ))}
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">平台总量与比率</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MousePointerClick size={14} />
            <span>互动 = 赞 + 评 + 收藏 + 投币 + 分享 + 弹幕</span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-3">
            {[1, 2].map((item) => (
              <div key={item} className="h-12 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : (
          <div>
            {(data?.platforms ?? []).map((item) => (
              <PlatformRow key={item.platform} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
