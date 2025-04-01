"use client"

import { useState } from 'react'
import Image from "next/image"
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
import { ArrowUpDown, ChevronDown, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
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

interface Artist {
    id: string
    name: string
    image_url: string
    genres: string[]
    country: string
    has_similar: boolean
    platform_ids: {
        spotify: string | null
        youtube: string | null
        deezer: string | null
        genius: string | null
        yt_charts: string | null
        musicbrainz: string | null
    }
}

interface ArtistPlatformTableProps {
    artists: Artist[]
}

export function ArtistPlatformTable({ artists }: ArtistPlatformTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const columns: ColumnDef<Artist>[] = [
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
                </div>
            ),
        },
        {
            accessorKey: "platform_ids.deezer",
            header: () => (
                <div className="flex items-center justify-center gap-2">
                    <Image
                        src="/images/deezer.svg"
                        alt="Deezer"
                        width={16}
                        height={16}
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.platform_ids.deezer ? <Check className="mx-auto" /> : <X className="mx-auto text-muted-foreground" />}
                </div>
            ),
        },
        {
            accessorKey: "platform_ids.musicbrainz",
            header: () => (
                <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px]">MusicBrainz</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.platform_ids.musicbrainz ? <Check className="mx-auto" /> : <X className="mx-auto text-muted-foreground" />}
                </div>
            ),
        },
        {
            accessorKey: "platform_ids.spotify",
            header: () => (
                <div className="flex items-center justify-center gap-2">
                    <Image
                        src="/images/spotify.svg"
                        alt="Spotify"
                        width={16}
                        height={16}
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.platform_ids.spotify ? <Check className="mx-auto" /> : <X className="mx-auto text-muted-foreground" />}
                </div>
            ),
        },
        {
            accessorKey: "platform_ids.youtube",
            header: () => (
                <div className="flex items-center justify-center gap-2">
                    <Image
                        src="/images/youtube.svg"
                        alt="YouTube"
                        width={16}
                        height={16}
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.platform_ids.youtube ? <Check className="mx-auto" /> : <X className="mx-auto text-muted-foreground" />}
                </div>
            ),
        },
        {
            accessorKey: "platform_ids.genius",
            header: () => (
                <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px]">Genius</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.platform_ids.genius ? <Check className="mx-auto" /> : <X className="mx-auto text-muted-foreground" />}
                </div>
            ),
        },
        {
            accessorKey: "platform_ids.yt_charts",
            header: () => (
                <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px]">YT Charts</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.platform_ids.yt_charts ? <Check className="mx-auto" /> : <X className="mx-auto text-muted-foreground" />}
                </div>
            ),
        },
        {
            accessorKey: "has_similar",
            header: () => (
                <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px]">Similar</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.has_similar ? <Check className="mx-auto" /> : <X className="mx-auto text-muted-foreground" />}
                </div>
            ),
        },
    ]

    const table = useReactTable({
        data: artists,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
        initialState: {
            pagination: {
                pageSize: 50,
            },
        },
    })

    return (
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
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No artists found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
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
    )
} 