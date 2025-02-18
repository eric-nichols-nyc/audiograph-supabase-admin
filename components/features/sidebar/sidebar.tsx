"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArtistList } from "../artist-list/artist-list";
import { Searchbar } from "./searchbar";
import { useDbArtistsStore } from "@/stores/use-db-artists-store";
import { Artist } from "@/types/artists";
import { useArtists } from '@/lib/queries/artists';

export function Sidebar() {
  const { data: artists, isLoading, error } = useArtists();
  const { setArtists } = useDbArtistsStore();
  
  // Set the artists from the prop into the store whenever they change.
  useEffect(() => {
    setArtists(artists);
  }, [artists, setArtists]);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading artists</div>;

  return <div className="flex flex-col gap-4 w-full h-full">
    <Button>add artist</Button>
    <div><Searchbar /></div>
    <div><ArtistList /></div>
  </div>;
}