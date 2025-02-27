"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getArtistTracksBySlug } from "@/actions/artist.tracks";
import { TrackTable } from "@/components/tracks/track-table";
import { ContentLayout } from "@/components/features/admin-panel/content-layout";

export default function SongsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: tracks, isLoading, error } = useQuery({
    queryKey: ["artist-tracks", slug],
    queryFn: async () => {
      try {
        const tracks = await getArtistTracksBySlug({ slug });
        if (!Array.isArray(tracks.data)) {
          throw new Error('Tracks are not an array');
        }
        return tracks.data;
      } catch (err) {
        throw new Error(`Failed to fetch tracks: ${(err as Error).message}`);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex w-full justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{(error as Error).message || "Failed to load tracks"}</span>
      </div>
    );
  }

  return (
    <ContentLayout>
      <TrackTable tracks={tracks || []} />
    </ContentLayout>
  );
}