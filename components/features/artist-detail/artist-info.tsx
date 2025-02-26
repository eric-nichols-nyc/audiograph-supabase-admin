"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Artist } from '@/types/artists';

export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat().format(num);
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}; 

interface ArtistInfoProps {
  artist: Artist;
}

export function ArtistInfo({ artist }: ArtistInfoProps) {
  const [expanded, setExpanded] = useState(false);
  const [bioPreview, setBioPreview] = useState('');
  const [hasMoreContent, setHasMoreContent] = useState(false);
  
  useEffect(() => {
    if (!artist?.bio) {
      setBioPreview('No biography available');
      setHasMoreContent(false);
      return;
    }
    
    // Get first paragraph or first 150 chars
    const firstParagraph = artist.bio.split('\n')[0];
    const preview = firstParagraph?.length > 150 
      ? firstParagraph.substring(0, 150) + '...'
      : firstParagraph;
      
    setBioPreview(preview);
    
    // Check if there's more content
    setHasMoreContent(artist.bio.length > preview.length);
    
    // Log for debugging
    console.log({
      fullBio: artist.bio,
      preview,
      hasMore: artist.bio.length > preview.length
    });
  }, [artist]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Artist data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Country:</span> {artist.country || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Gender:</span> {artist.gender || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Birth Date:</span> {formatDate(artist.birth_date)}
              </p>
              <p>
                <span className="font-medium">Genres:</span>{' '}
                {Array.isArray(artist.genres) ? artist.genres.join(', ') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-gray-700">
            {expanded ? artist.bio : bioPreview}
          </div>
          
          {hasMoreContent && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Read full bio
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 