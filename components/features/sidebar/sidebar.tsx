"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArtistList } from "../artist-list/artist-list";
import { Searchbar } from "./searchbar";
import { useDbArtistsStore } from "@/stores/use-db-artists-store";
import { Artist } from "@/types/artists";

interface SidebarProps {
  dbArtists: Artist[];
}
export function Sidebar({ dbArtists }: SidebarProps) {
  const { artists, setArtists } = useDbArtistsStore();
  
  // Set the artists from the prop into the store whenever they change.
  useEffect(() => {
    setArtists(dbArtists);
  }, [dbArtists, setArtists]);
  
  return <div className="flex flex-col gap-4 w-full h-full">
    <Button>add artist</Button>
    <div><Searchbar /></div>
    <div><ArtistList /></div>
  </div>;
}