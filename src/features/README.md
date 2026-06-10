# Features 目录 — AI Agent 隔离规则

## 目录结构

每个功能一个文件夹，自包含：

```
features/
├── <feature-name>/
│   ├── components/     # 该功能专属组件
│   ├── hooks/          # 该功能专属 React Hooks
│   ├── queries/        # Supabase 查询封装
│   ├── types.ts        # 该功能的类型定义
│   ├── widgets.ts      # (可选) 如果该功能向 Dashboard 暴露 widget
│   └── index.ts        # 公开导出
```

## 隔离规则（AI Agent 必须遵守）

### ✅ 允许
- feature 内部文件互相引用
- feature 引用 `@/components/ui/*`（共享 UI 组件）
- feature 引用 `@/lib/*`（工具函数、Supabase client）
- feature 引用 `@/components/layout/*`（布局组件）

### ❌ 禁止
- **feature A 引用 feature B 的任何文件** — 这是最重要的规则
- feature 直接操作其他 feature 的 DOM
- feature 修改全局状态（除非通过明确的共享 store）

## 添加新面板 Widget

1. 创建 `features/<new-widget>/` 目录
2. 写组件 `features/<new-widget>/components/MainPanel.tsx`
3. 在 `features/dashboard/widgets.ts` 数组**末尾**注册：
   ```ts
   {
     id: 'my-new-widget',
     title: '我的新卡片',
     grid: 'col-span-6',
     component: lazy(() => import('../my-new-widget/components/MainPanel')),
   }
   ```
4. 不要修改任何已有文件的其他部分

## 添加新页面

1. 创建 `src/app/<new-page>/page.tsx`
2. 在 `src/components/layout/Sidebar.tsx` 的 `navItems` 数组末尾追加导航项
3. 业务逻辑放在 `src/features/<new-page>/`
