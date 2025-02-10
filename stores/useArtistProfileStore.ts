import { create } from "zustand";
import { Artist } from "@/types/artists";
interface ArtistProfileStore {
  artistData: Artist | null;
  setArtistData: (artistData: Artist) => void;
}

export const useArtistProfileStore = create<ArtistProfileStore>((set) => ({
  artistData: null,
  setArtistData: (artistData) => set({ artistData }),
}));
