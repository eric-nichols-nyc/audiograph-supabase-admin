import { Navbar } from "@/components/features/admin-panel/navbar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div className="w-full">
      <Navbar title={title} />
      <div className="pt-8 pb-8">{children}</div>
    </div>
  );
}
