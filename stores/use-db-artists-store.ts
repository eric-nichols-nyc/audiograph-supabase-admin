import { create } from "zustand";
import type { Artist } from "@/types/artists";

interface DBArtistsStore {
  artists: Artist[];
  fetchArtists: () => Promise<void>;
  selectedArtist: Artist | null;
  // Sets/replaces the full list of artists
  setArtists: (artists: Artist[]) => void;
  // Adds a new artist to the store
  addArtist: (artist: Artist) => void;
  // Deletes an artist by id
  deleteArtist: (artistId: string) => void;
  // Sets a selected artist (or clears it by passing null)
  setSelectedArtist: (artist: Artist | null) => void;
  isLoading: boolean;
}

export const useDbArtistsStore = create<DBArtistsStore>((set) => ({
  artists: [],
  selectedArtist: null,
  isLoading: false,
  fetchArtists: async () => {
    console.log("fetching artists from db store");
  },
  setArtists: (artists: Artist[]) => set({ artists }),
  addArtist: (artist: Artist) =>
    set((state) => ({
      artists: [...state.artists, artist],
    })),
  deleteArtist: (artistId: string) =>
    set((state) => ({
      artists: state.artists.filter((artist) => artist.id !== artistId),
    })),
  setSelectedArtist: (artist: Artist | null) => set({ selectedArtist: artist }),
})); 