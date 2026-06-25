# Dashboard 部署规则

> **核心原则：只上传构建产物，不上传源码、密码、本地配置。**

## Netlify 部署流程

```
本地 npm run build → 上传 .next 目录 → Netlify 部署
```

- `netlify deploy --prod` 会先在本地执行 `npm run build`
- 然后只上传 `netlify.toml` 里 `publish = ".next"` 指定的目录
- `.env.local` 在构建时被 Next.js 读取，`NEXT_PUBLIC_*` 变量内联进 JS bundle
- **`.env.local` 文件本身不会上传到 CDN**

## 哪些文件会上传

| 文件/目录 | 上线 | 说明 |
|-----------|------|------|
| `.next/` (构建产物) | ✅ | Next.js 编译输出，Netlify 直接部署 |
| `public/` (静态资源) | ✅ (打包进.next) | favicon、图片等 |

## 哪些文件绝不上传

| 文件/目录 | 原因 |
|-----------|------|
| `node_modules/` | 依赖由 Netlify 构建时安装 |
| `.env.local` | 含 Supabase 密钥（虽然 anon key 是公开的），通过 Netlify 环境变量注入 |
| `.env.production` | 同上 |
| `.env` | 同上 |
| `.netlify/` | Netlify 本地缓存，勿删 |
| `.edgeone/` | EdgeOne 本地缓存 |
| `.tef_dist/` | EdgeOne 构建产物缓存 |
| `.next/` (源码目录) | gitignore 排除，不提交到仓库 |
| `*.tsbuildinfo` | TypeScript 增量编译缓存 |

## 环境变量

### 已在 Netlify 配置
```
NEXT_PUBLIC_SUPABASE_URL=https://pqpopervpirlyklviyjq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres
```

### 绝不在前端暴露
```
SUPABASE_SERVICE_ROLE_KEY  → 仅爬虫本地使用
```

## 数据源规则

- Dashboard 运行时只读 Supabase，不再使用本地 PostgreSQL。
- `SUPABASE_DATABASE_URL` 必须是 Supabase pooled Postgres 连接串。
- 不要把 `DATABASE_URL` 配成 `localhost`；代码会默认拒绝本地库。
- 服务端 API 使用内存缓存、磁盘缓存和 HTTP/CDN 缓存头保护 Supabase 流量。
- `/agent` 历史会话使用服务端直连 Supabase Postgres 持久化，依赖 `SUPABASE_DATABASE_URL`，不再写本地 `json` 文件。

## 部署命令

```bash
cd dashboard
netlify deploy --prod
```

## 已知问题

1. **CLI 输出假死**: Windows 下 `netlify deploy --prod` 终端 spinner 可能在 "Uploading files" 卡住，实际 API 已完成。部署后立刻用 MCP `get-deploy` 查实际状态，不等 CLI。
2. **Supabase 1000 行限制**: 查询 `metrics_daily` 记得加 `.limit(50000)`，否则大日期范围数据被截断。
