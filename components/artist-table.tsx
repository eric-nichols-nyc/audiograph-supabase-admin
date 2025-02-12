"use client"
import { useEffect, useState } from 'react'
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
import { useDbArtistsStore } from '@/stores/use-db-artists-store'
import { Artist } from '@/types/artists'

export function ArtistMetricsTable() {
  const { artists, fetchArtists, isLoading } = useDbArtistsStore()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<Artist[]>(artists)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // useEffect(() => {
  //   if (artists.length === 0) {
  //     fetchArtists()
  //   }
  // }, [fetchArtists])

  useEffect(() => {
    setData(artists)
    console.log('artists', artists)
  }, [artists])

  const columns: ColumnDef<Artist>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
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
          <Link href={`/admin/artists/${row.original.id}/${row.original.slug}`}>
            <div className="h-11 w-11 rounded-md overflow-hidden">
              <Image 
                src={row.original.image_url || "/images/placeholder.jpg"}
              alt={row.getValue("name")}
              width={44}
              height={44}
              className="object-cover"
              />
            </div>
          </Link>
          <div className="space-y-1">
            <div className="font-medium">{row.getValue("name")}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              </div>
              {row.original.genres && (
                <div className="text-xs">
                  {row.original.genres.slice(0, 2).join(", ")}
                  {row.original.genres.length > 2 && "..."}
                </div>
              )}
            </div>
        </div>
      ),
    },
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
    },
    {
      accessorKey: "country",
      header: () => (
        <div className="flex items-center justify-end gap-2">
          
          <span>Country</span>
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
      accessorKey: "popularity",
      header: () => (
          <div className="flex items-center justify-end gap-2">
            <Image
              src="/images/spotify.svg"
              alt="Spotify"
              width={16}
              height={16}
            />
            <span>Popularity</span>
          </div>
        ),
      cell: ({ row }) => {
        const popularity = parseInt(row.getValue("popularity"))
        return (
          <div className="text-right font-medium">
            {popularity}
            <span className="text-xs text-muted-foreground ml-1">/100</span>
          </div>
        )
      },
    },
    {
      accessorKey: "gender",
      header: () => (
          <div className="flex items-center justify-end gap-2">
            <span>Gender</span>
          </div>
        ),
      cell: ({ row }) => {
        const gender = row.getValue("gender") as string
        return <div className="text-right font-medium">{gender}</div>
      },
    },
    {
      accessorKey: "is_complete",
      header: () => (
          <div className="flex items-center justify-end gap-2">
            <span>Completed</span>
          </div>
        ),
      cell: ({ row }) => {
        const isComplete = row.getValue("is_complete") as boolean
        return <div className="text-right font-medium">{isComplete ? "Yes" : "No"}</div>
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
  })

  if (isLoading) {
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
                      <TableHead key={header.id}>
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
                      <TableCell key={cell.id}>
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