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
import { ArrowUpDown, ExternalLink, Play } from "lucide-react";

const columnHelper = createColumnHelper<Video>();

const columns = [
  columnHelper.display({
    id: "rowNumber",
    header: "#",
    cell: (info) => (
      <div className="text-center text-sm text-gray-400 font-medium w-8">
        {info.row.index + 1}
      </div>
    ),
    size: 50,
  }),
  columnHelper.accessor("thumbnail_url", {
    header: "",
    cell: (info) => (
      <Link href={`https://www.youtube.com/watch?v=${info.row.original.video_id}`} target="_blank" className="block relative">
        <div className="relative w-20 h-12 rounded overflow-hidden group">
          {info.getValue() ? (
            <>
              <Image 
                src={info.getValue() || ''} 
                alt={info.row.original.title} 
                fill 
                className="object-cover transition-opacity group-hover:opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">No image</span>
            </div>
          )}
        </div>
      </Link>
    ),
    size: 80,
  }),
  columnHelper.accessor("title", {
    header: "Title",
    cell: (info) => (
      <div className="flex flex-col">
        <Link 
          href={`https://www.youtube.com/watch?v=${info.row.original.video_id}`} 
          target="_blank"
          className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[300px]"
        >
          {info.getValue()}
          <ExternalLink className="w-3 h-3 inline opacity-50" />
        </Link>
        <span className="text-xs text-gray-500 mt-1">
          Published {new Date(info.row.original.published_at).toLocaleDateString()}
        </span>
      </div>
    ),
    size: 300,
  }),
  columnHelper.accessor("view_count", {
    header: ({ column }) => (
      <div className="flex items-center justify-end">
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1"
        >
          Total Views
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </button>
      </div>
    ),
    cell: (info) => (
      <div className="text-right font-medium">
        {formatNumber(info.getValue())}
        <div className="text-xs text-gray-500">all time</div>
      </div>
    ),
  }),
  columnHelper.accessor("daily_view_count", {
    header: ({ column }) => (
      <div className="flex items-center justify-end">
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1"
        >
          Daily Views
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </button>
      </div>
    ),
    cell: (info) => {
      const value = info.getValue();
      const isPositive = value > 0;
      return (
        <div className="text-right font-medium">
          {formatNumber(value)}
          <div className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{formatNumber(value)}
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("published_at", {
    header: ({ column }) => (
      <div className="flex items-center justify-end">
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1"
        >
          Published
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </button>
      </div>
    ),
    cell: (info) => (
      <div className="text-right">
        {new Date(info.getValue()).toLocaleDateString()}
      </div>
    ),
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
    <div className="rounded-lg border border-gray-200 shadow-sm">
      <div className="overflow-x-auto max-h-[70vh] relative">
        {/* Fixed header */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider shadow-sm"
                    style={{ width: header.column.getSize() }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, i) => (
                <tr 
                  key={row.id} 
                  className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-500">
                  No videos found for this artist.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {videos.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500 border-t">
          Showing {videos.length} video{videos.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
} 