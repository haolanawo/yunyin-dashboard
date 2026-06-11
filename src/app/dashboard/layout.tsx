export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">老板驾驶舱</h1>
      <p className="text-sm text-gray-500 mb-6">跨平台账号、内容和互动的经营总览。</p>
      <div className="grid grid-cols-12 gap-4">
        {children}
      </div>
    </div>
  );
}
