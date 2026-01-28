"use client";

import * as React from "react";
import {
  ColumnDef,
  Column,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- Types ---

export type ColumnConfig<TData> = {
  key: keyof TData;
  label: string;
  type: "string" | "number";
  enableSorting?: boolean;
  width?: number;
};

interface AdvancedDataTableProps<TData> {
  data: TData[];
  columns: ColumnConfig<TData>[];
  defaultPageSize?: number;
}

// --- Internal Helper Components ---

const HeaderWithType = <TData,>({
  column,
  type,
  text,
}: {
  column: Column<TData, unknown>;
  type: "string" | "number";
  text: string;
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="group flex items-center w-full gap-1.5">
      {/* Left content */}
      <span className="text-[10px] uppercase text-muted-foreground/70 font-mono tracking-tighter">
        {type === "number" ? "123" : "ABC"}
      </span>

      <span className="font-medium text-muted-foreground truncate">{text}</span>

      {/* Right menu */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="
              h-6 w-6 p-0 ml-auto
              opacity-0
              group-hover:opacity-100
              transition-opacity
              data-[state=open]:opacity-100
            "
          >
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side="bottom"
          className="w-40"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <DropdownMenuItem
            onClick={() => column.toggleSorting(false)}
            className={column.getIsSorted() === "asc" ? "bg-accent" : ""}
          >
            Sort Ascending
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => column.toggleSorting(true)}
            className={column.getIsSorted() === "desc" ? "bg-accent" : ""}
          >
            Sort Descending
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// --- Main Component ---

export function AdvancedDataTable<TData>({
  data,
  columns: columnConfigs,
  defaultPageSize = 10,
}: AdvancedDataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Convert simple column config to TanStack ColumnDef
  const tableColumns = React.useMemo<ColumnDef<TData>[]>(() => {
    // Index Column
    const indexCol: ColumnDef<TData> = {
      id: "index",
      header: () => (
        <div className="flex items-center justify-center h-full w-full">
          <span className="font-medium text-muted-foreground">#</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium text-muted-foreground">
          {row.index + 1}
        </div>
      ),
      enableSorting: false,
      size: 50,
    };

    // Data Columns
    const dataCols: ColumnDef<TData>[] = columnConfigs.map((col) => ({
      accessorKey: col.key as string,
      header: ({ column }) => (
        <HeaderWithType column={column} type={col.type} text={col.label} />
      ),
      enableSorting: col.enableSorting ?? true, // Default to true if not specified
      size: col.width || 120, // Default width
      cell: ({ row }) => {
        const value = row.getValue(col.key as string) as string | number;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="truncate w-full">{value}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{value}</p>
            </TooltipContent>
          </Tooltip>
        );
      },
    }));

    return [indexCol, ...dataCols];
  }, [columnConfigs]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    defaultColumn: {
      size: 120,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto bg-background">
        <TooltipProvider>
          <Table className="table-fixed w-max min-w-full border-collapse border border-border">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-9 px-2 border-r border-b border-border text-xs bg-muted/30"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
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
                        className="h-9 px-2 border-r border-b border-border text-xs p-0 [&>div]:px-2 [&>div]:flex [&>div]:items-center [&>div]:h-full"
                        style={{ width: cell.column.getSize() }}
                      >
                        <div style={{ width: cell.column.getSize() }}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
