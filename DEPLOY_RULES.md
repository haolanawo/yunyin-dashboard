# Dashboard 部署规则

> 当前线上部署以 Vercel 绑定项目为准，不再使用 Netlify。

## 当前绑定

`dashboard/.vercel/project.json` 当前指向：

- `projectId`: `prj_2VNuR8YCsyNAQD0fjyGY4h4VPH4M`
- `orgId`: `team_UpGHiUamLLdmdM4Wv2wjptnj`
- `projectName`: `dashboard`

## Vercel 部署流程

```bash
本地验证 npm run typecheck && npm run build
→ 提交代码
→ 通过已绑定的 Vercel 项目产生产线部署
```

- 当前项目是 Next.js，Vercel 负责安装依赖、执行构建、托管产物。
- 本地 `npm run dev` 和 `npm run build` 只用于验证，不是上传 `.next/` 目录到平台。
- 如果本地运行过 `next build`，再继续用 `npm run dev` 前最好重启 dev server，避免 `.next` 产物混用。

## 哪些文件应保留

| 文件/目录 | 用途 |
|-----------|------|
| `.vercel/project.json` | 本地目录与 Vercel 项目的绑定信息 |
| `vercel.json` | 仅当项目未来显式增加时使用；当前没有 |

## 哪些文件不应再使用

| 文件/目录 | 说明 |
|-----------|------|
| `netlify.toml` | 已废弃，本项目不再走 Netlify 构建/发布 |
| `.netlify/` | Netlify 本地状态目录，已废弃 |

## 环境变量

Vercel 线上需要配置：

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_DATABASE_URL
```

绝不放到前端公开环境中的变量：

```text
SUPABASE_SERVICE_ROLE_KEY
```

## 数据源规则

- Dashboard 运行时只读 Supabase，不再使用本地 PostgreSQL。
- `SUPABASE_DATABASE_URL` 必须是 Supabase pooled Postgres 连接串。
- 不要把 `DATABASE_URL` 配成 `localhost`；代码会默认拒绝本地库。
- 服务端 API 使用内存缓存、磁盘缓存和 HTTP/CDN 缓存头保护 Supabase 流量。

## 常用命令

```bash
cd dashboard
npm run typecheck
npm run build
npm run dev
```
