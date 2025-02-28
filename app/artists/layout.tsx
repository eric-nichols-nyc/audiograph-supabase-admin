import { SharedAdminLayout } from "@/components/features/admin-panel/shared-admin-layout";

export default function ArtistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SharedAdminLayout>{children}</SharedAdminLayout>;
}