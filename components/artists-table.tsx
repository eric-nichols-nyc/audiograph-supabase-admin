"use client";

import { useState, CSSProperties, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Column,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface ArtistPlatformId {
  platform: string;
  platform_id: string;
}

interface Artist {
  id: string;
  name: string;
  slug: string;
  artist_platform_ids?: ArtistPlatformId[];
}

const defaultColumns: ColumnDef<Artist>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => row.index + 1,
    size: 50,
    enablePinning: true,
  },
  {
    accessorKey: "id",
    id: "id",
    header: "Artist ID",
    cell: info => info.getValue(),
    size: 220,
    enablePinning: true,
  },
  {
    accessorKey: "name",
    id: "name",
    header: "Name",
    cell: info => info.getValue(),
    size: 220,
    enablePinning: true,
    filterFn: 'includesString',
  },
  {
    accessorKey: "slug",
    id: "slug",
    header: "Slug",
    cell: info => info.getValue(),
    size: 180,
  },
  {
    id: "youtube",
    header: "YouTube Channel",
    cell: ({ row }) => {
      const youtubeChannel = row.original.artist_platform_ids?.find(
        platform => platform.platform === 'youtube'
      );
      
      return youtubeChannel ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-500">{youtubeChannel.platform_id}</span>
          <a
            href={`https://youtube.com/channel/${youtubeChannel.platform_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Channel
          </a>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
    size: 280,
  },
];

interface ArtistsTableProps {
  artists: Artist[];
}

const getCommonPinningStyles = (column: Column<Artist>): CSSProperties => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn = 
    isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRightPinnedColumn = 
    isPinned === "right" && column.getIsFirstColumn("right");

  return {
    boxShadow: isLastLeftPinnedColumn
      ? "-4px 0 4px -4px gray inset"
      : isFirstRightPinnedColumn
        ? "4px 0 4px -4px gray inset"
        : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  };
};

export default function ArtistsTable({ artists }: ArtistsTableProps) {
  // Add more detailed logging
  console.log('Artists received in table:', {
    artists,
    isArray: Array.isArray(artists),
    length: artists?.length,
    type: typeof artists
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const [columns] = useState(() => [...defaultColumns]);
  const [globalFilter, setGlobalFilter] = useState(searchParams?.get("q") || "");
  
  const updateSearchParams = useDebouncedCallback((search: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (search) {
      params.set("q", search);
    } else {
      params.delete("q");
    }
    router.push(`?${params.toString()}`);
  }, 300);

  const handleSearch = (value: string) => {
    setGlobalFilter(value);
    updateSearchParams(value);
  };

  useEffect(() => {
    const searchQuery = searchParams?.get("q");
    if (searchQuery !== globalFilter) {
      setGlobalFilter(searchQuery || "");
    }
  }, [searchParams]);

  const table = useReactTable({
    data: Array.isArray(artists) ? artists : [],  // Ensure we always pass an array
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    columnResizeMode: "onChange",
    initialState: {
      columnPinning: {
        left: ['index', 'name']
      }
    },
  });

  return (
    <div className="w-full">
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search all columns..."
            value={globalFilter ?? ""}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-md border px-8 py-2 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table style={{ width: table.getTotalSize() }} className="w-full">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const { column } = header;
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ ...getCommonPinningStyles(column) }}
                        className={cn(
                          "border-b bg-muted/50 px-4 py-3 text-left align-middle font-medium",
                          column.getIsPinned() && "bg-background"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="whitespace-nowrap">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </div>
                          <div
                            onDoubleClick={() => header.column.resetSize()}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={cn(
                              "resizer cursor-col-resize select-none",
                              header.column.getIsResizing() ? "isResizing" : "",
                              "h-full w-1 bg-border hover:bg-foreground/70"
                            )}
                          />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map(cell => {
                    const { column } = cell;
                    return (
                      <td
                        key={cell.id}
                        style={{ ...getCommonPinningStyles(column) }}
                        className={cn(
                          "border-b px-4 py-2",
                          column.getIsPinned() && "bg-background"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Remove or comment out the pre tag if you don't need to debug */}
      {/* <pre>{JSON.stringify(table.getState().columnPinning, null, 2)}</pre> */}
    </div>
  );
}

