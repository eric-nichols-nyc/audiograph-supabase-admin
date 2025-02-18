import AddArtist from "@/components/add-artist";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export default function AddArtistPage() {
  return <ContentLayout title="Add Artist">
    <AddArtist />
  </ContentLayout>;
}
