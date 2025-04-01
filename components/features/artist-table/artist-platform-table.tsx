"use client"

import { useState, useEffect } from 'react'
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
import { ArrowUpDown, ChevronDown, Check, X, Copy, ClipboardCheck } from "lucide-react"

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
import { ArtistDetailsSheet } from './sheet/artist-details-sheet'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArtistWithMetrics } from './types'
import { toast } from "sonner"

interface Artist extends ArtistWithMetrics {
    id: string;
    has_similar: boolean;
    platform_ids: {
        spotify: string | null;
        youtube: string | null;
        deezer: string | null;
        genius: string | null;
        yt_charts: string | null;
        musicbrainz: string | null;
    }
}

interface ArtistPlatformTableProps {
    artists: Artist[]
}

export function ArtistPlatformTable({ artists }: ArtistPlatformTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Function to copy text to clipboard
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(text);
            toast.success("Artist ID copied to clipboard");
            // Reset the copied state after 2 seconds
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            toast.error("Failed to copy to clipboard");
        }
    };

    // Function to update URL with artist ID query parameter
    const updateUrlWithArtistId = (artist: Artist | null) => {
        const newPath = artist ? `?artistId=${artist.id}` : '';
        router.replace(newPath, { scroll: false });
    };

    // Check for artistId in URL on component mount and when data changes
    useEffect(() => {
        const artistId = searchParams?.get('artistId');
        if (artistId && artists.length > 0 && !selectedArtist) {
            const artist = artists.find(a => a.id === artistId);
            if (artist) {
                setSelectedArtist(artist);
                setSheetOpen(true);
            }
        }
    }, [searchParams, artists, selectedArtist]);

    // Update URL when selected artist changes
    useEffect(() => {
        updateUrlWithArtistId(selectedArtist);
    }, [selectedArtist]);

    const columns: ColumnDef<Artist>[] = [
        {
            id: "number",
            header: "#",
            cell: ({ row }) => {
                const pageSize = table?.getState().pagination.pageSize || 50;
                const pageIndex = table?.getState().pagination.pageIndex || 0;
                return <div className="text-right font-medium w-10">{pageIndex * pageSize + row.index + 1}</div>;
            },
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
            cell: ({ row }) => {
                const artist = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => {
                                setSelectedArtist(artist);
                                setSheetOpen(true);
                            }}
                        >
                            <div className="h-11 w-11 rounded-md overflow-hidden">
                                <Image
                                    src={artist.image_url || "/images/placeholder.jpg"}
                                    alt={row.getValue("name")}
                                    width={44}
                                    height={44}
                                    className="object-cover"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="font-medium">{row.getValue("name")}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <span>{artist.id}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(artist.id);
                                        }}
                                        className="p-1 hover:bg-muted rounded-md transition-colors"
                                        title="Copy artist ID"
                                    >
                                        {copiedId === artist.id ? (
                                            <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            },
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
        <>
            <ArtistDetailsSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                artist={selectedArtist}
            />

            <div className="w-full relative">
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
                        <DropdownMenuContent align="end" className="z-50">
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
                <div className="rounded-md border relative">
                    <Table>
                        <TableHeader className="sticky top-0 z-20 bg-background">
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
        </>
    )
} 