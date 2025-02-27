"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getArtistVideosBySlug } from "@/actions/artist.videos";
import { VideoTable } from "@/components/videos/video-table";
import { ContentLayout } from "@/components/admin-panel/content-layout";
export default function VideosPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: videos, isLoading, error } = useQuery({
    queryKey: ["artist-videos", slug],
    queryFn: async () => {
      try {
        const videos = await getArtistVideosBySlug({ slug });
        console.log('videos ', videos);
        return Array.isArray(videos.data) ? videos.data : videos;
      } catch (err) {
        throw new Error(`Failed to fetch videos: ${(err as Error).message}`);
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
        <span className="block sm:inline">{(error as Error).message || "Failed to load videos"}</span>
      </div>
    );
  }

  return (
    <ContentLayout>
      <VideoTable videos={videos || []} />
    </ContentLayout>
  );
}