# 知乎竞品数据面板 (dashboard/)

> Next.js 15 App Router | Tailwind CSS | Recharts | Supabase | Vercel 部署

## 命令

```bash
npm run dev        # localhost:3000
npm run build      # 生产构建
npx vercel --prod --yes   # 部署到 Vercel 生产环境
```

## 环境变量 (.env.local)

| 变量 | 用途 | 暴露给浏览器 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase REST API 地址 | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 (RLS) | ✅ |
| `SUPABASE_DATABASE_URL` | Supabase Postgres 直连 (pg Pool) | ❌ server-only |
| `ENABLE_DIRECT_SQL` | 设为 "1" 启用直连 SQL | ❌ |

## 架构

```
src/
├── app/                    # Next.js 路由 (薄层)
│   ├── api/                # API Routes (SSR)
│   │   ├── trends/accounts/   → getTrendAccounts() → supabaseRpc('get_trend_accounts')
│   │   ├── trends/series/     → getTrendSeries()    → supabaseRpc('get_trend_series') [知乎]
│   │   │                                           → queryLocalDb() [B站, 复杂SQL]
│   │   ├── local-db/         → 通用 SQL 代理 (白名单表+列)
│   │   └── dashboard/        → executive-overview, recent-contents
│   ├── trends/page.tsx       # 客户端渲染，通过 hooks 调 API
│   ├── dashboard/page.tsx    # 首页仪表盘
│   └── contents/page.tsx     # 内容排行
├── features/               # 业务逻辑 (feature 间禁止互相引用)
│   ├── trends/
│   │   ├── hooks/useTrends.ts          # useAccountList, useAccountTrends (TanStack Query)
│   │   └── components/
│   │       ├── TrendLineChart.tsx      # 折线图 (daily/cumulative, Brush 缩放)
│   │       └── AccountTrendSelector.tsx
│   ├── dashboard/
│   ├── content-ranking/
│   └── ...
├── components/ui/           # 共享 UI 原语
├── components/layout/       # Sidebar, Header
└── lib/
    ├── server/
    │   ├── analyticsAggregations.ts   # 所有数据查询函数 (核心!)
    │   ├── analyticsCache.ts          # 内存+磁盘双层缓存 (TTL 30min)
    │   ├── cachedRoute.ts             # API Routes 缓存包装器
    │   └── supabaseRest.ts            # supabaseRpc(), supabaseRest()
    ├── local-db.ts                    # queryLocalDb() — pg Pool 直连 Supabase
    ├── client/cachedApi.ts            # fetchCachedApi() — 浏览器端请求
    └── supabase.ts                    # Supabase 浏览器 SDK client
```

## 数据流 (趋势页为例)

```
浏览器 trends/page.tsx
  → useAccountTrends()                     [TanStack Query, staleTime=24h]
  → fetchCachedApi('/api/trends/series?...')
  → GET /api/trends/series
  → respondWithCache()                     [AnalyticsCache, TTL=30min]
  → getTrendSeries('zhihu', ids, range)
  → supabaseRpc('get_trend_series', ...)   [Supabase REST POST /rpc/...]
  → PostgreSQL 函数 get_trend_series()
```

## UI 交互逻辑

### 趋势页 日增量 vs 历史累计
- 知乎没有 `trafficDaily` 字段，Chart 组件在前端用 `当日累计 - 前日累计` 算日增量
- 30天/7天切换时，不同 dateRange 对应不同的 TanStack Query 缓存 key
- `staleTime: 24h` 意味着同一天内切换回之前查过的时间段，会命中旧缓存
- 点「刷新数据」按钮强制 invalidate

### TrendLineChart
- `dateRange` prop: 传入时若采样日 ≥4 天，会补齐日期轴空白（enumerateDates）
- `< 4` 天采样时只显示有数据的日期，不补齐
- Brush 自动缩放到最后约 8 天的范围

## 部署

- **生产 URL**: `https://dashboard-olive-nine-69.vercel.app`
- **平台**: Vercel (Next.js SSR, API Routes 自动转为 Serverless Functions)
- **部署命令**: `cd dashboard && npx vercel --prod --yes`
- **Vercel 项目**: `haolan-s-projects/dashboard`

## 故障排查

| 症状 | 排查步骤 |
|---|---|
| 线上看不到当天数据 | 1. Supabase 有数据? `SELECT snapshot_date FROM metrics_daily WHERE snapshot_date = CURRENT_DATE` 2. API 返回? `curl https://.../api/trends/series?...` 3. 清浏览器缓存 |
| 本地 dev 崩了 | 1. `Remove-Item -Recurse -Force .next/cache` 2. `npm run dev` |
| 日增量=历史累计 | 只采样1天时正常(算不出差值)，≥2天应不同；检查 trend.trafficDaily 是否为 null |