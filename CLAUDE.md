# 知乎竞品数据面板

> 监控 5 个 AI 工具赛道知乎账号 | 880+ 帖子 | 11 维 AI 结构分析

## 技术栈
- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS 3.4
- **数据库**: Supabase 云端 PostgreSQL（前端直连，无需 API 代理层）
- **图表**: Recharts 2.x
- **部署**: Netlify (SSR + API Routes via @netlify/plugin-nextjs)
- **图标**: Lucide React
- **爬虫**: Python 本地定时任务 → 直接写 Supabase（service_role key）

## 项目上下文

### 数据源
- Supabase 云端 PostgreSQL，前端通过 anon key + RLS 直连读取
- 爬虫每天 8:00 增量更新，本地 Python 脚本直接用 service_role key 写入 Supabase
- 5 张核心表：`contents`, `metrics_daily`, `manual_labels`, `zhihu_accounts`, `zhihu_writing_rules`

### 面板目标用户：运营人员
他们每天想知道：
1. 今天有什么新帖 / 数据异动
2. 5 个账号横向对比谁表现好
3. 哪些帖子在涨 / 在跌
4. 怎么写下一篇帖子更好（AI 写作指导）

### 产品规格 & 技术设计
详见 `../openspec/specs/` 目录下的完整文档。

---

## 架构总览

```
src/
├── app/           # 路由层（薄层，只做组合和布局）
│   ├── layout.tsx           # 根布局：Sidebar + Header + {children}
│   ├── api/                 # API Route（仅用于外部服务调用，如 AI 打分）
│   ├── dashboard/           # 首页：今日动态 + 竞品矩阵
│   ├── contents/            # 内容排行 + 搜索
│   ├── content/[id]/        # 单篇详情 + 结构拆解
│   ├── trends/              # 趋势图表
│   └── writing-guide/       # 写作指导 + 草稿打分
├── features/      # 业务功能（每个功能一个文件夹，禁止互相引用）
│   ├── daily-briefing/      # 今日动态摘要
│   ├── account-overview/    # 5 账号对比
│   ├── content-ranking/     # 帖子排行榜
│   ├── post-detail/         # 单篇结构分析
│   ├── trend-chart/         # 趋势折线图
│   └── writing-guide/       # 写作规则 + 打分
├── components/    # 共享组件
│   ├── ui/                  # 底层原语（Card, Button, Badge, DataCard）
│   └── layout/              # 布局组件（Sidebar, Header）
└── lib/           # 工具函数
    ├── supabase.ts          # Supabase 浏览器端 client
    ├── api-types.ts         # 所有数据模型的 TS 类型
    └── utils.ts             # 通用工具
```

---

## AI 协作核心规则

### 0. 总规则——先读文档
**在写任何代码之前，先读 `../openspec/specs/` 下的文档：**
- `PRODUCT_SPEC.md` — 产品需求，你做的功能解决运营什么问题？
- `TECHNICAL_DESIGN.md` — 技术方案（Supabase schema、爬虫策略、部署架构）
- `AI_WRITING_GUIDE.md` — AI 分析能力，11 维特征和 10 条写作规则
- `AGENT_COLLABORATION.md` — 多 Agent 分工边界

### 1. Feature 隔离
**每个 feature 是独立孤岛。** feature A 禁止 import feature B。
共享组件放 `components/ui/`，共享类型放 `lib/api-types.ts`。

### 2. 添加功能
- **加新页面**: 新建 `src/app/<name>/page.tsx` → 在 Sidebar 的 navItems 末尾追加
- **加仪表盘卡片**: 新建 `src/features/<name>/` → 在 dashboard widgets 数组末尾注册
- **改已有功能**: 只改那个 feature 文件夹内的文件

### 3. API 契约优先
在写组件之前，先在 `src/lib/api-types.ts` 定义好数据模型类型。前端和后端 Agent 可以并行开发。

### 4. 数据访问
- 组件直接通过 `@/lib/supabase` 的 `createClient()` 查询 Supabase
- 数据查询逻辑封装在 feature 的 `hooks/` 中，用 `@tanstack/react-query`
- 不需要 Next.js API Route 做数据代理（Supabase SDK 自带缓存和实时订阅）

### 5. 样式
- 优先 Tailwind utility class
- 颜色使用 `brand-*` 色板
- 不写自定义 CSS 文件（除非动画/阴影）

---

## 命令
```bash
npm run dev        # 启动 Next.js 开发服务器 (localhost:3000)
npm run build      # 生产构建
npm run typecheck  # TypeScript 检查
npm run lint       # ESLint
```

## 环境变量
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase 匿名密钥（仅读取权限）
- `SUPABASE_DATABASE_URL` — Supabase Postgres 直连字符串（API Routes SSR 端使用，不在浏览器暴露）
- 爬虫另行配置 `SUPABASE_SERVICE_ROLE_KEY`（写入权限），不在前端暴露

## 部署

- **生产**: Netlify (`rainbow-zabaione-2bb7df.netlify.app`)
- **部署方式**: GitHub Actions → `netlify deploy --build --prod`，使用 `@netlify/plugin-nextjs` 生成 Netlify Functions 处理 SSR + API Routes
- **GitHub Secrets 需要**: `NETLIFY_AUTH_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_DATABASE_URL`
