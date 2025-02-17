import React from 'react';
import Image from 'next/image';
import { Video } from '@/types/artists';
import { formatDate } from '@/utils/format/dates';
import { formatNumber } from '@/utils/format/numbers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VideosTableProps {
  videos: Video[];
}

export function VideosTable({ videos }: VideosTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead className="w-[80px]"></TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="text-right">Views</TableHead>
          <TableHead className="text-right">Added</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {videos.map((video, index) => (
          <TableRow key={video.id || index}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>
              {video.thumbnail_url ? (
                <Image
                  src={video.thumbnail_url}
                  alt={video.title || 'Video thumbnail'}
                  width={40}
                  height={40}
                  className="rounded-md"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No img</span>
                </div>
              )}
            </TableCell>
            <TableCell className="font-medium">{video.title || 'Untitled Video'}</TableCell>
            <TableCell className="text-right">{formatNumber(video.view_count)}</TableCell>
            <TableCell className="text-right text-muted-foreground">{formatDate(video.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 