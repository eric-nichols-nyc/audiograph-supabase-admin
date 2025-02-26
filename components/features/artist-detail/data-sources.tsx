"use client"
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArtistPlatformId } from '@/types/artists';
import Image from 'next/image';
import { ExternalLink, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditDataSourcesDialog } from './edit-data-sources-dialog';
import { platformConfig, getPlatformUrl } from '@/config/platforms';

interface PlatformIdsProps {
  platformIds?: ArtistPlatformId[];
  artistId?: string;
}

export function PlatformIds({ platformIds = [], artistId }: PlatformIdsProps) {
  if (!artistId) {
    console.warn('No artistId provided to PlatformIds component');
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Data Sources</CardTitle>
        {artistId && (
          <EditDataSourcesDialog 
            platformIds={platformIds} 
            artistId={artistId} 
            trigger={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Edit data sources</span>
              </Button>
            }
          />
        )}
      </CardHeader>
      <CardContent>
        {platformIds.length > 0 ? (
          <div className="space-y-4">
            {platformIds.map((platform, index) => {
              const config = platformConfig[platform.platform as keyof typeof platformConfig];
              const platformUrl = getPlatformUrl(platform.platform, platform.platform_id);
              
              return (
                <div key={platform.id || index} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {config ? (
                      <div className="w-8 h-8 relative flex-shrink-0">
                        <Image 
                          src={config.logo} 
                          alt={config.name} 
                          width={32} 
                          height={32} 
                          className="object-contain"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">{platform.platform?.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{config?.name || platform.platform}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{platform.platform_id}</p>
                    </div>
                  </div>
                  
                  <a 
                    href={platformUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                  >
                    <span className="text-xs text-gray-600 max-w-[180px] truncate hidden sm:inline">{platformUrl}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No platform IDs available</p>
        )}
      </CardContent>
    </Card>
  );
} 