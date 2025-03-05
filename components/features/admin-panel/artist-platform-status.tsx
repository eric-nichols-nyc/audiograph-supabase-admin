'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Edit, ExternalLink } from 'lucide-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';

type ArtistPlatformStatus = {
  id: string;
  name: string;
  hasSpotify: boolean;
  hasYoutube: boolean;
  spotifyId?: string;
  youtubeId?: string;
};

export function ArtistPlatformStatus() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filter, setFilter] = useState<'all' | 'missing'>('all');

  // Fetch artist platform status data using React Query
  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['artists', 'platform-status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/artist-platform-status');
      const data = await response.json();
      return data.artists as ArtistPlatformStatus[];
    },
  });

  // Define columns for the table
  const columns = useMemo<ColumnDef<ArtistPlatformStatus>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Artist Name',
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
      },
      {
        accessorKey: 'hasSpotify',
        header: 'Spotify',
        cell: ({ row }) => {
          const hasSpotify = row.getValue('hasSpotify');
          const spotifyId = row.original.spotifyId;

          return (
            <div className="flex items-center gap-2">
              {hasSpotify ? (
                <>
                  <div className="flex items-center gap-1">
                    <Image src="/images/spotify.svg" alt="Spotify" width={16} height={16} />
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Connected
                    </Badge>
                  </div>
                  {spotifyId && (
                    <a
                      href={`https://open.spotify.com/artist/${spotifyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <Image src="/images/spotify.svg" alt="Spotify" width={16} height={16} />
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Missing
                  </Badge>
                </div>
              )}
            </div>
          );
        },
        filterFn: (row, id, value) => {
          return value === 'all' ? true : !row.getValue(id);
        },
      },
      {
        accessorKey: 'hasYoutube',
        header: 'YouTube',
        cell: ({ row }) => {
          const hasYoutube = row.getValue('hasYoutube');
          const youtubeId = row.original.youtubeId;

          return (
            <div className="flex items-center gap-2">
              {hasYoutube ? (
                <>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                  {youtubeId && (
                    <a
                      href={`https://www.youtube.com/channel/${youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Missing
                </Badge>
              )}
            </div>
          );
        },
        filterFn: (row, id, value) => {
          return value === 'all' ? true : !row.getValue(id);
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const artist = row.original;

          return (
            <div className="flex items-center gap-2">
              <Link href={`/artists/${artist.id}/edit`} passHref>
                <Button size="sm" variant="outline" className="h-8 px-2 lg:px-3">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          );
        },
      },
    ],
    []
  );

  // Create a filtered version of the data based on the current filter
  const filteredData = useMemo(() => {
    if (filter === 'all') return artists;
    return artists.filter(artist => !artist.hasSpotify || !artist.hasYoutube);
  }, [artists, filter]);

  // Initialize the table
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search artists..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All Artists
          </Button>
          <Button
            variant={filter === 'missing' ? 'default' : 'outline'}
            onClick={() => setFilter('missing')}
            size="sm"
          >
            Missing Platforms
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="bg-muted/50 h-12">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading artist data...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No artists found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} artist
          {table.getFilteredRowModel().rows.length === 1 ? '' : 's'}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
