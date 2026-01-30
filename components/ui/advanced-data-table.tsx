"use client";

import * as React from "react";
import {
  ColumnDef,
  Column,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
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
  X,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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

const FilterMenu = <TData,>({
  column,
  type,
}: {
  column: Column<TData, unknown>;
  type: "string" | "number";
}) => {
  const filterValue = (column.getFilterValue() as any) || {
    operator: type === "number" ? "eq" : "contains",
    value: "",
  };

  const [operator, setOperator] = React.useState(filterValue.operator);
  const [value, setValue] = React.useState(filterValue.value);

  const handleFilterChange = (newOperator: string, newValue: string) => {
    setOperator(newOperator);
    setValue(newValue);
    column.setFilterValue({ operator: newOperator, value: newValue });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Settings2 className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
        Filter
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="p-3 w-52">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Operator
            </label>
            <select
              className="w-full h-8 text-xs border rounded-md bg-transparent px-2 focus:outline-none focus:ring-1 focus:ring-ring"
              value={operator}
              onChange={(e) => handleFilterChange(e.target.value, value)}
              onClick={(e) => e.stopPropagation()}
            >
              {type === "number" ? (
                <>
                  <option value="eq">Equal To (=)</option>
                  <option value="gt">Greater Than (&gt;)</option>
                  <option value="lt">Less Than (&lt;)</option>
                </>
              ) : (
                <>
                  <option value="contains">Contains</option>
                  <option value="startsWith">Starts With</option>
                  <option value="endsWith">Ends With</option>
                </>
              )}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Value
            </label>
            <input
              type={type === "number" ? "number" : "text"}
              className="w-full h-8 text-xs border rounded-md bg-transparent px-2 focus:outline-none focus:ring-1 focus:ring-ring"
              value={value}
              onChange={(e) => handleFilterChange(operator, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Filter..."
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="w-full h-7 text-xs"
            onClick={() => {
              setOperator(type === "number" ? "eq" : "contains");
              setValue("");
              column.setFilterValue(undefined);
            }}
          >
            Clear Filter
          </Button>
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

const FilterSummary = <TData,>({
  table,
}: {
  table: ReturnType<typeof useReactTable<TData>>;
}) => {
  const filters = table.getState().columnFilters;
  if (filters.length === 0) return null;

  const operatorMap: Record<string, string> = {
    eq: "=",
    gt: ">",
    lt: "<",
    contains: "contains",
    startsWith: "starts with",
    endsWith: "ends with",
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2 p-2 bg-muted/20 border rounded-md">
      <span className="text-xs font-medium text-muted-foreground mr-2">
        Active Filters:
      </span>
      {filters.map((filter) => {
        const column = table.getColumn(filter.id);
        const filterValue = filter.value as { operator: string; value: string };
        const label = column?.columnDef.header as any;
        // Note: Header might be a function, but we are using column configs to get label usually.
        // For simplicity, we can use the ID or try to get the label from the config if passed active.
        // But table.getAllColumns() has the info.

        return (
          <Badge
            key={filter.id}
            variant="secondary"
            className="flex items-center gap-1.5 px-2 py-1 font-normal"
          >
            <span className="font-semibold">{filter.id}:</span>
            <span className="text-muted-foreground">
              {operatorMap[filterValue.operator] || filterValue.operator}
            </span>
            <span>{filterValue.value}</span>
            <button
              onClick={() => column?.setFilterValue(undefined)}
              className="ml-1 hover:text-destructive focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
        onClick={() => table.resetColumnFilters()}
      >
        Clear All
      </Button>
    </div>
  );
};

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
  const isFiltered = column.getFilterValue() !== undefined;

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
              "h-6 w-6 p-0 ml-auto transition-opacity relative",
              isSorted || open || isFiltered
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100",
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

          <FilterMenu column={column} type={type} />

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
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<any[]>([]);

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
      filterFn: (row, columnId, filterValue: any) => {
        if (!filterValue || !filterValue.value) return true;

        const rowValue = row.getValue(columnId);
        const { operator, value } = filterValue;

        if (col.type === "number") {
          const numRowValue = Number(rowValue);
          const numValue = Number(value);

          if (isNaN(numValue)) return true;

          switch (operator) {
            case "gt":
              return numRowValue > numValue;
            case "lt":
              return numRowValue < numValue;
            case "eq":
              return numRowValue === numValue;
            default:
              return true;
          }
        } else {
          const strRowValue = String(rowValue).toLowerCase();
          const strValue = String(value).toLowerCase();

          switch (operator) {
            case "contains":
              return strRowValue.includes(strValue);
            case "startsWith":
              return strRowValue.startsWith(strValue);
            case "endsWith":
              return strRowValue.endsWith(strValue);
            default:
              return true;
          }
        }
      },
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
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Filter Summary Row */}
      <FilterSummary table={table} />

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
