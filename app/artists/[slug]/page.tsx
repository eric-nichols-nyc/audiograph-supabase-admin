import {ArtistDetailView} from "@/components/artist-detail-view";
import eminemData from "@/public/eminem-inserted-artist.json";

export default function ArtistPage() {
  return <ArtistDetailView data={eminemData.data} />;
}
