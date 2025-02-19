import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";

export default function ArtistsLayout({ children }: { children: React.ReactNode }) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}