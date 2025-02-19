'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatchArtistSelect } from "@/components/features/batch/batch-artist-select";

export function BatchArtists() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Add Artists</CardTitle>
        </CardHeader>
        <CardContent>
          <BatchArtistSelect />
        </CardContent>
      </Card>
    </div>
  );
} 