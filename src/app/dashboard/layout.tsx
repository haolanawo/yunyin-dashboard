// ============================================================
// Dashboard 子布局 — 12 列网格容器
// 所有 /dashboard/* 页面自动填入此网格
//
// AI Agent 规则：
//   加新的 dashboard 子页面时，页面组件的根元素应包含 col-span-* 类
//   与父级的 grid 配合形成响应式布局
// ============================================================

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">数据总览</h1>
      <div className="grid grid-cols-12 gap-4">
        {children}
      </div>
    </div>
  );
}
