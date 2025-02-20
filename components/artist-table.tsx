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
import { Artist } from '@/types/artists'
import { useArtistMetrics } from '@/hooks/use-artist-metrics'
import { ArtistMetric } from '@/types/artists'
import { cn } from "@/lib/utils"
import { CSSProperties } from "react"

const getCommonPinningStyles = (column: Column<Artist>): CSSProperties => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn = 
    isPinned === "left" && column.getIsLastColumn("left");

  return {
    boxShadow: isLastLeftPinnedColumn
      ? "-4px 0 4px -4px gray inset"
      : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  };
};

export function ArtistMetricsTable() {
  const { data: artistsResponse, isLoading: artistsLoading } = useArtists()
  const { data: metrics, isLoading: metricsLoading } = useArtistMetrics()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  // Add console logs to debug data
  console.log('Artists:', artistsResponse?.data)
  console.log('Metrics:', metrics)
  
  const data = useMemo(() => {
    return artistsResponse?.data?.map(artist => {
      const youtubeMetric = metrics?.find(m => 
        m.artist_id === artist.id && 
        m.platform === 'youtube' && 
        m.metric_type === 'subscribers'
      );

      const spotifyMetric = metrics?.find(m => 
        m.artist_id === artist.id && 
        m.platform === 'spotify' && 
        m.metric_type === 'popularity'
      );

      return {
        ...artist,
        youtube_subscribers: youtubeMetric?.value ?? null,
        spotify_popularity: spotifyMetric?.value ?? null
      };
    }) ?? [];
  }, [artistsResponse?.data, metrics])

  const columns: ColumnDef<Artist>[] = [
    {
      accessorKey: "rank",
      header: () => (
        <div className="flex items-center justify-end gap-2">
          <span>Rank</span>
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
        const artist = row.original
 
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
              <DropdownMenuItem onClick={() => {
                setSelectedArtist(artist as unknown as Artist)
                setSheetOpen(true)
              }}>
                Edit artist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
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
      columnPinning: {
        left: ['rank', 'name']
      }
    },
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
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id}
                        style={{ 
                          ...getCommonPinningStyles(header.column),
                          height: '40px'
                        }}
                        className={cn(
                          "px-6 h-[40px]",
                          header.column.getIsPinned() && "bg-background"
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
                        style={{ 
                          ...getCommonPinningStyles(cell.column),
                          height: '40px'
                        }}
                        className={cn(
                          "px-6 h-[40px]",
                          cell.column.getIsPinned() && "bg-background"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
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