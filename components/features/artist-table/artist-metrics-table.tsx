"use client"
import { useEffect, useState, useMemo } from 'react'
import Image from "next/image"
import Link from "next/link"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Column,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useArtists } from '@/hooks/use-artists'
import { Artist, ArtistMetric } from '@/types/artists'
import { useArtistMetrics } from '@/hooks/use-artist-metrics'
import { cn } from "@/lib/utils"
import { bulkUpdateSpotifyPopularity } from "@/actions/artist"
import { toast } from "sonner"
import { ArtistDropdownMenu } from "./artist-dropdown-menu"

interface ArtistResponse {
  data: {
    data: Artist[];
  };
}

interface MetricsResponse {
  data: {
    data: ArtistMetric[];
  };
}

export function ArtistMetricsTable() {
  const { data: artistsResponse, isLoading: artistsLoading, mutate: mutateArtists } = useArtists() as { 
    data: ArtistResponse | undefined;
    isLoading: boolean;
    mutate: () => Promise<void>;
  };

  const { data: metrics, isLoading: metricsLoading, mutate: mutateMetrics } = useArtistMetrics() as {
    data: MetricsResponse | undefined;
    isLoading: boolean;
    mutate: () => Promise<void>;
  };

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  // Add console logs to debug data
//   console.log('Artists:', artistsResponse?.data.data)
//   console.log('Metrics:', metrics?.data?.data)
  
  const data = useMemo(() => {
    if (!artistsResponse?.data?.data || !metrics?.data?.data) {
      return [];
    }

    return artistsResponse.data.data.map((artist: Artist) => {
      const youtubeMetric = metrics.data.data.find((m: ArtistMetric) => 
        m.artist_id === artist.id && 
        m.platform === 'youtube' && 
        m.metric_type === 'subscribers'
      );

      const spotifyMetric = metrics.data.data.find((m: ArtistMetric) => 
        m.artist_id === artist.id && 
        m.platform === 'spotify' && 
        m.metric_type === 'popularity'
      );

      return {
        ...artist,
        youtube_subscribers: youtubeMetric?.value ?? null,
        spotify_popularity: spotifyMetric?.value ?? null
      };
    });
  }, [artistsResponse?.data?.data, metrics?.data?.data]);

  const handleUpdate = async () => {
    await Promise.all([
      mutateArtists(),
      mutateMetrics()
    ]);
  };

  const handleBulkUpdate = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    
    if (selectedRows.length === 0) {
      toast.error("No artists selected");
      return;
    }

    const artists = selectedRows.map((row) => ({
      artistName: row.original.name
    }));

    try {
      const result = await bulkUpdateSpotifyPopularity({ artists });
      if (!result) {
        toast.error("Failed to update artists");
        return;
      }

      if (result.data) {
        toast.success(result.data.message);
        await handleUpdate();
        table.toggleAllRowsSelected(false); // Deselect all rows after update
      }
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to update artists"
      );
    }
  };

  const columns: ColumnDef<Artist>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="px-1">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-1">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 30,
    },
    {
      accessorKey: "rank",
      header: ({ column }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Rank
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const rank = parseInt(row.getValue("rank"))
        const formatted = new Intl.NumberFormat().format(rank)
        return (
          <div className="flex items-center justify-end gap-2">
            <span className="font-medium">{formatted}</span>
          </div>
        )
      },
      size: 80,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Artist
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Link href={`/artists/${row.original.slug}`}>
            <div className="h-11 w-11 rounded-md overflow-hidden">
              <Image 
                src={row.original.image_url || "/images/placeholder.jpg"}
                alt={row.getValue("name")}
                width={44}
                height={44}
                className="object-cover"
              />
            </div>
            <div className="space-y-1">
              <div className="font-medium">{row.getValue("name")}</div>
              {row.original.genres && (
                <div className="text-xs text-muted-foreground">
                  {row.original.genres.slice(0, 2).join(", ")}
                  {row.original.genres.length > 2 && "..."}
                </div>
              )}
            </div>
          </Link>
        </div>
      ),
      size: 300,
    },
    {
      accessorKey: "country",
      header: () => (
        <div className="flex items-center justify-end gap-2">
          <span className="text-[10px]">Country</span>
        </div>
      ),
      cell: ({ row }) => {
        const country = row.getValue("country") as string
        return (
          <div className="flex items-center justify-end gap-2">
              {row.original.country && (
                <div className="flex items-center gap-1.5">
                  <Image
                    src={`/flags/${row.original.country.toLowerCase()}.svg`}
                    alt={row.original.country}
                    width={16}
                    height={12}
                    className="rounded-sm"
                  />
                  <span>{row.original.country}</span>
                </div>
              )}
          </div>
        )
      },
    },
    {
      accessorKey: "is_complete",
      header: () => (
          <div className="flex items-center justify-end gap-2">
             <span className="text-[10px]">Completed</span>
          </div>
        ),
      cell: ({ row }) => {
        const isComplete = row.getValue("is_complete") as boolean
        return <div className="text-right font-medium">{isComplete ? "Yes" : "No"}</div>
      },
    },
    {
      accessorKey: "youtube_subscribers",
      header: () => (
        <div className="flex items-center justify-end gap-2">
          <Image
            src="/images/youtube.svg"
            alt="YouTube"
            width={16}
            height={16}
          />
          <span className="text-[10px]">Subscribers</span>
        </div>
      ),
      cell: ({ row }) => {
        const subscribers = row.getValue("youtube_subscribers") as number | null
        return subscribers ? (
          <div className="text-right font-medium">
            {Intl.NumberFormat('en', { notation: 'compact' }).format(subscribers)}
          </div>
        ) : (
          <div className="text-right text-muted-foreground">-</div>
        )
      },
    },
    {
      accessorKey: "spotify_popularity",
      header: () => (
        <div className="flex items-center justify-end gap-2">
          <Image
            src="/images/spotify.svg"
            alt="Spotify"
            width={16}
            height={16}
          />
          <span className="text-[10px]">Popularity</span>
        </div>
      ),
      cell: ({ row }) => {
        const popularity = row.getValue("spotify_popularity") as number | null
        return popularity ? (
          <div className="text-right font-medium">
            {popularity}
          </div>
        ) : (
          <div className="text-right text-muted-foreground">-</div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const artist = row.original;
        return (
          <ArtistDropdownMenu 
            artist={artist} 
            onEdit={(artist) => {
              setSelectedArtist(artist);
              setSheetOpen(true);
            }}
            onUpdate={handleUpdate}
          />
        );
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      sorting: [
        { id: 'rank', desc: false }
      ],
      columnOrder: ['select', 'rank', 'name', /* other column ids */]
    },
    enableRowSelection: true,
  })

  if (artistsLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="text-muted-foreground">Loading artists...</div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter artists..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Button
            onClick={handleBulkUpdate}
            className="ml-2"
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
          >
            Update Spotify Popularity Selected ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead 
                          key={header.id}
                          className={cn(
                            "h-[40px]",
                            header.id === 'select' ? 'px-1' : 'px-6',
                            "border-b bg-background"
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id}
                          className={cn(
                            cell.column.id === 'select' ? 'px-1' : 'px-6'
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No artists found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
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
    </>
  )
}