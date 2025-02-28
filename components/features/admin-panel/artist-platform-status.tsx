"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type ArtistPlatformStatus = {
  id: string;
  name: string;
  hasSpotify: boolean;
  hasYoutube: boolean;
  spotifyId?: string;
  youtubeId?: string;
};

export function ArtistPlatformStatus() {
  const [artists, setArtists] = useState<ArtistPlatformStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "missing">("all");
  
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await fetch("/api/admin/artist-platform-status");
        const data = await response.json();
        setArtists(data.artists);
      } catch (error) {
        console.error("Error fetching artist platform status:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArtists();
  }, []);
  
  const filteredArtists = artists
    .filter(artist => 
      artist.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter(artist => 
      filter === "all" || (!artist.hasSpotify || !artist.hasYoutube)
    );
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
          >
            All Artists
          </Button>
          <Button
            variant={filter === "missing" ? "default" : "outline"}
            onClick={() => setFilter("missing")}
            size="sm"
          >
            Missing Platforms
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artist Name</TableHead>
              <TableHead>Spotify ID</TableHead>
              <TableHead>YouTube ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Loading artist data...
                </TableCell>
              </TableRow>
            ) : filteredArtists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  No artists found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredArtists.map(artist => (
                <TableRow key={artist.id}>
                  <TableCell className="font-medium">{artist.name}</TableCell>
                  <TableCell>
                    {artist.hasSpotify ? (
                      <span className="text-green-600">{artist.spotifyId}</span>
                    ) : (
                      <span className="text-red-500">Missing</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {artist.hasYoutube ? (
                      <span className="text-green-600">{artist.youtubeId}</span>
                    ) : (
                      <span className="text-red-500">Missing</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 