export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-12 gap-4">
        {children}
      </div>
    </div>
  );
}
