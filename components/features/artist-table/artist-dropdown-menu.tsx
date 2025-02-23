import { Artist } from "@/types/artists";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateSpotifyPopularity } from "@/actions/artist";

interface ArtistDropdownMenuProps {
  artist: Artist;
  onEdit?: (artist: Artist) => void;
  onUpdate?: () => Promise<void>;
}

export function ArtistDropdownMenu({ artist, onEdit, onUpdate }: ArtistDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(artist.id!)}
        >
          Copy artist ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>View details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(artist)}>
          Edit artist
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            try {
              const result = await updateSpotifyPopularity({
                artistName: artist.name
              });

              if (!result) {
                toast.error("Failed to update Spotify popularity");
                return;
              }

              if (result.data) {
                toast.success(result.data.message);
                if (onUpdate) {
                  await onUpdate();
                }
              }
            } catch (error) {
              toast.error(
                error instanceof Error 
                  ? error.message 
                  : "Failed to update Spotify popularity"
              );
            }
          }}
        >
          Update Spotify Popularity
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 