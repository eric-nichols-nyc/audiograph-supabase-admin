export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Admin" />
      <main className="flex-1 overflow-auto pt-14">
        {children}
      </main>
    </div>
  );
} 