"use client";

import { useState, CSSProperties, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Column,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { faker } from "@faker-js/faker";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "@/hooks/use-debounce";

interface Person {
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: string;
  progress: number;
}

const getCommonPinningStyles = (column: Column<Person>): CSSProperties => {
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

const defaultColumns: ColumnDef<Person>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => row.index + 1,
    footer: props => props.column.id,
    size: 50,
    enablePinning: true,
  },
  {
    accessorKey: "firstName",
    id: "firstName",
    header: "First Name",
    cell: info => info.getValue(),
    footer: props => props.column.id,
    size: 220,
    enablePinning: true,
    filterFn: 'includesString',
  },
  {
    accessorFn: row => row.lastName,
    id: "lastName",
    cell: info => info.getValue(),
    header: () => <span>Last Name</span>,
    footer: props => props.column.id,
    size: 180,
  },
  {
    accessorKey: "age",
    id: "age",
    header: "Age",
    footer: props => props.column.id,
    size: 180,
  },
  {
    accessorKey: "visits",
    id: "visits",
    header: "Visits",
    footer: props => props.column.id,
    size: 180,
  },
  {
    accessorKey: "status",
    id: "status",
    header: "Status",
    footer: props => props.column.id,
    size: 180,
  },
  {
    accessorKey: "progress",
    id: "progress",
    header: "Profile Progress",
    footer: props => props.column.id,
    size: 180,
  },
];

// Helper function to generate random data
const makeData = (len: number): Person[] => {
  return Array(len).fill(null).map(() => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    age: faker.number.int({ min: 18, max: 80 }),
    visits: faker.number.int(100),
    status: faker.helpers.shuffle(['relationship', 'complicated', 'single'])[0],
    progress: faker.number.int(100),
  }));
};

export default function ArtistsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState(() => makeData(30));
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

  // Handle search change
  const handleSearch = (value: string) => {
    setGlobalFilter(value);
    updateSearchParams(value);
  };

  // Sync URL search param with state on mount and URL changes
  useEffect(() => {
    const searchQuery = searchParams?.get("q");
    if (searchQuery !== globalFilter) {
      setGlobalFilter(searchQuery || "");
    }
  }, [searchParams]);

  const rerender = () => setData(() => makeData(30));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
    columnResizeMode: "onChange",
    initialState: {
      columnPinning: {
        left: ['index', 'firstName']
      },
      rowPinning: {
        top: ['#']
      }
    },
  });

  const randomizeColumns = () => {
    table.setColumnOrder(
      faker.helpers.shuffle(table.getAllLeafColumns().map(d => d.id))
    );
  };

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

      {/* Column visibility controls */}
      {/* <div className="mb-4 flex items-center gap-4">
        <div className="rounded-lg border bg-card p-2">
          <div className="border-b px-2 py-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={table.getIsAllColumnsVisible()}
                onChange={table.getToggleAllColumnsVisibilityHandler()}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Toggle All</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2 p-2">
            {table.getAllLeafColumns().map(column => (
              <label key={column.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">{column.id}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={rerender} 
            className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
          >
            Regenerate
          </button>
          <button 
            onClick={randomizeColumns} 
            className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
          >
            Shuffle Columns
          </button>
        </div>
      </div> */}
      
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

