import { Sidebar } from "@/components/features/sidebar/sidebar";

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full">
      <div className="w-1/4">
        <Sidebar />
      </div>
      <div className="w-3/4">{children}</div>
    </div>
  );
}
