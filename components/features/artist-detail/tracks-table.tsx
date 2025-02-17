import React from 'react';
import Image from 'next/image';
import { Track } from '@/types/artists';
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

interface TracksTableProps {
  tracks: Track[];
}

export function TracksTable({ tracks }: TracksTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead className="w-[80px]"></TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="text-right">Streams</TableHead>
          <TableHead className="text-right">Added</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tracks.map((track, index) => (
          <TableRow key={track.id || index}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>
              {track.thumbnail_url ? (
                <Image
                  src={track.thumbnail_url}
                  alt={track.title || 'Track thumbnail'}
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
            <TableCell className="font-medium">{track.title || 'Untitled Track'}</TableCell>
            <TableCell className="text-right">{formatNumber(track.stream_count_total)}</TableCell>
            <TableCell className="text-right text-muted-foreground">{formatDate(track.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 