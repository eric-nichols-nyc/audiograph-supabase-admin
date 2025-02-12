import {Sidebar} from "@/components/features/sidebar/sidebar";
import { getArtists } from "@/actions/artist";
import { Artist } from "@/types/artists";


async function getArtistsFromDb(): Promise<Artist[]> {
  try {
    const result = await getArtists();
    // If result is an array, use it; otherwise unwrap the data property
    const artists = result?.data;
    return artists ?? [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const artists = (await getArtistsFromDb()) ?? [];
    console.log(artists);
  return (
      <div className="flex w-full">
        <div className="w-1/4">
          <Sidebar dbArtists={artists} />
        </div>
        <div className="w-3/4">{children}</div>
      </div>
  );
}