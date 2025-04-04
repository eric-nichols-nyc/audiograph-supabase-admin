"use client";
import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Artist } from "@/types/artists";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDbArtistsStore } from "@/stores/use-db-artists-store";

interface ArtistListItemProps {
  artist: Artist;
}

export function ArtistListItem({ artist }: ArtistListItemProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteArtist } = useDbArtistsStore();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      if (!artist.id) {
        throw new Error("Artist ID is missing");
      }
      deleteArtist(artist.id);
      setIsDeleting(false);
    } catch (error) {
      console.error("Error deleting artist:", error);
      setIsDeleting(false);
    }
  };
  
  return (  
    <Link
      href={`/artists/${artist.slug}`}
      className={cn(
        "flex items-center w-full gap-3 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors group",
        isSelected && "bg-gray-100"
      )}
    >
      <div className="relative w-10 h-10">
        <Image
          src={artist.image_url || '/images/default-artist.jpg'}
          alt={artist.name}
          fill
          className="rounded-full object-cover"
        />
      </div>
      <span className={cn(
        "text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate flex-1",
        isSelected && "text-gray-900"
      )}>
        {artist.name}
      </span>
      {artist.is_complete ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <span className="text-xs text-gray-500">Incomplete</span>
      )}
      <Button 
        className="z-10"
        variant="outline" 
        size="icon" 
        onClick={handleDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </Link>
  );
} 