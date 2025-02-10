import { Button } from "@/components/ui/button";
import { ArtistList } from "./artist-list";
import { Searchbar } from "./searchbar";
export function Sidebar() {
  return <div className="flex flex-col gap-4 w-full h-full bg-red-500">
    <Button>add artist</Button>
    <div><Searchbar /></div>
    <div><ArtistList /></div>
  </div>;
}