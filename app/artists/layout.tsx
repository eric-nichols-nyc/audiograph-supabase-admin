import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";
import { useArtists } from '@/hooks/use-artists';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useArtists();
  return (
    <AdminPanelLayout>
      {children}
    </AdminPanelLayout>
  );
}