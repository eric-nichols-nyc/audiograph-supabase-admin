"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Video } from "@/types/artists";
import { formatNumber } from "@/lib/utils";

const columnHelper = createColumnHelper<Video>();

const columns = [
  columnHelper.accessor("thumbnail_url", {
    header: "Thumbnail",
    cell: (info) => (
      <Link href={`https://www.youtube.com/watch?v=${info.row.original.video_id}`} target="_blank">
        <div className="relative w-24 h-16 rounded overflow-hidden">
          {info.getValue() ? (
            <Image 
              src={info.getValue() || ''} 
              alt={info.row.original.title} 
              fill 
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">No image</span>
            </div>
          )}
        </div>
      </Link>
    ),
  }),
  columnHelper.accessor("title", {
    header: "Title",
    cell: (info) => (
      <Link 
        href={`https://www.youtube.com/watch?v=${info.row.original.video_id}`} 
        target="_blank"
        className="text-blue-600 hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("view_count", {
    header: "Total Views",
    cell: (info) => formatNumber(info.getValue()),
  }),
  columnHelper.accessor("daily_view_count", {
    header: "Daily Views",
    cell: (info) => formatNumber(info.getValue()),
  }),
  columnHelper.accessor("published_at", {
    header: "Published Date",
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
];

interface VideoTableProps {
  videos: Video[];
}

export function VideoTable({ videos }: VideoTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "view_count", desc: true },
  ]);

  const table = useReactTable({
    data: videos,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    <span className="ml-1">
                      {{
                        asc: "🔼",
                        desc: "🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {videos.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No videos found for this artist.
        </div>
      )}
    </div>
  );
} 