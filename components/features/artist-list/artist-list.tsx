"use client";
import { useDbArtistsStore } from "@/stores/use-db-artists-store";
import { Artist } from "@/types/artists";
import { ArtistListItem } from "./artist-list-item";
export function ArtistList() {
  const { artists } = useDbArtistsStore();

  if (artists.length === 0) {
    return <div>No artists available.</div>;
  }

  return (
    <ul>
      {artists.map((artist: Artist) => (
        // Assuming each artist has an 'id' and 'name'; adjust fields as necessary.
        <ArtistListItem key={artist.id} artist={artist} />
      ))}
    </ul>
  );
} 