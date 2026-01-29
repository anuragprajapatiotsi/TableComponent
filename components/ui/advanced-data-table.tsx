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
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import {
  MoreVertical,
  ArrowUp,
  ArrowDown,
  EyeOff,
  ChevronsUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { cn } from "@/lib/utils";

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
  const isSorted = column.getIsSorted();

  return (
    <div className="group flex items-center w-full gap-1.5">
      <span className="text-[10px] uppercase text-muted-foreground/70 font-mono tracking-tighter">
        {type === "number" ? "123" : "ABC"}
      </span>

      <span className="font-medium text-muted-foreground truncate flex-1">
        {text}
      </span>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 ml-auto transition-opacity",
              isSorted || open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            <span className="sr-only">Open menu</span>
            {isSorted === "asc" ? (
              <ArrowUp className="h-3 w-3 text-primary" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="h-3 w-3 text-primary" />
            ) : (
              <MoreVertical className="h-3 w-3" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Sort Options
          </DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Ascending
            {isSorted === "asc" && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Descending
            {isSorted === "desc" && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>

          {isSorted && (
            <DropdownMenuItem onClick={() => column.clearSorting()}>
              <ChevronsUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Clear Sort
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide Column
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
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

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
      enableHiding: false,
      size: 50,
    };

    // Data Columns
    const dataCols: ColumnDef<TData>[] = columnConfigs.map((col) => ({
      accessorKey: col.key as string,
      header: ({ column }) => (
        <HeaderWithType column={column} type={col.type} text={col.label} />
      ),
      enableSorting: col.enableSorting ?? true,
      size: col.width || 120,
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
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* View / Column Toggle Button */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto h-8 flex">
              <Settings2 className="mr-2 h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          
          {/* Added max-h-[300px] and overflow-y-auto here */}
          <DropdownMenuContent 
            align="end" 
            className="w-[180px] max-h-[300px] overflow-y-auto"
          >
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
              .map((column) => {
                const colLabel = columnConfigs.find(c => c.key === column.id)?.label || column.id;
                
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {colLabel}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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