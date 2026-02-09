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
  ColumnFiltersState,
  OnChangeFn,
  VisibilityState,
  useReactTable,
  PaginationState,
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
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  X,
  Loader2,
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
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSub,
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

export type ColumnType = "string" | "number" | "boolean" | "date" | "datetime";

export type ColumnConfig<TData> = {
  key: keyof TData;
  label: string;
  type: ColumnType;
  enableSorting?: boolean;
  width?: number;
};

interface AdvancedDataTableProps<TData> {
  data?: TData[];
  columns?: ColumnConfig<TData>[];
  endpoint?: string;
  defaultPageSize?: number;
  params?: Record<string, string | number | boolean>;
  // Controlled state for filters
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  // Callback when columns are loaded
  onColumnsLoaded?: (cols: ColumnConfig<TData>[]) => void;
  // UI toggles
  hideHeaderFilters?: boolean;
  hideFilterSummary?: boolean;
  // Block Pagination Props
  onNextBlock?: () => void;
  onPreviousBlock?: () => void;
  hasMoreBlocks?: boolean;
  hasPreviousBlocks?: boolean;
  serverTotalRows?: number;
  isLoadingPage?: boolean;
  offset?: number;
  // Column Visibility
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
}

// --- Filter Configuration ---

export const FILTER_OPERATORS: Record<
  ColumnType,
  { label: string; value: string }[]
> = {
  string: [
    { label: "Contains", value: "contains" },
    { label: "Equal To", value: "eq" },
    { label: "Starts With", value: "starts_with" },
    { label: "Ends With", value: "ends_with" },
  ],
  number: [
    { label: "Equal To (=)", value: "eq" },
    { label: "Greater Than (>)", value: "gt" },
    { label: "Less Than (<)", value: "lt" },
    { label: "Greater Than or Equal (>=)", value: "gte" },
    { label: "Less Than or Equal (<=)", value: "lte" },
  ],
  date: [
    { label: "Equal To", value: "eq" },
    { label: "Before", value: "lt" },
    { label: "After", value: "gt" },
    { label: "On or After", value: "gte" },
    { label: "On or Before", value: "lte" },
  ],
  datetime: [
    { label: "Equal To", value: "eq" },
    { label: "Before", value: "lt" },
    { label: "After", value: "gt" },
    { label: "On or After", value: "gte" },
    { label: "On or Before", value: "lte" },
  ],
  boolean: [
    { label: "True", value: "eq" }, // For boolean, typically just direct equality checks or "is true/false"
  ],
};

function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
) {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// --- Internal Helper Components ---

const FilterMenu = <TData,>({
  column,
  type,
}: {
  column: Column<TData, unknown>;
  type: ColumnType;
}) => {
  const options = FILTER_OPERATORS[type] || FILTER_OPERATORS.string;
  const defaultOperator = options[0].value;

  const filterValue = (column.getFilterValue() as any) || {
    operator: defaultOperator,
    value: "",
  };

  const [operator, setOperator] = React.useState(filterValue.operator);
  const [value, setValue] = React.useState(filterValue.value);

  const debouncedSetFilter = useDebouncedCallback(
    (op: string, val: string) => {
      if (val === undefined || val === null || String(val).trim() === "") {
        column.setFilterValue(undefined); // Clear filter if empty
        return;
      }
      column.setFilterValue({ operator: op, value: val, type });
    },
    400, // debounce delay (ms)
  );

  const handleFilterChange = (newOperator: string, newValue: string) => {
    setOperator(newOperator);
    setValue(newValue);
    debouncedSetFilter(newOperator, newValue);
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
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Value
            </label>
            {type === "boolean" ? (
              <select
                className="w-full h-8 text-xs border rounded-md bg-transparent px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                value={value}
                onChange={(e) => handleFilterChange(operator, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select...</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : (
              <input
                type={
                  type === "number"
                    ? "number"
                    : type === "date"
                      ? "date"
                      : type === "datetime"
                        ? "datetime-local"
                        : "text"
                }
                className="w-full h-8 text-xs border rounded-md bg-transparent px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                value={value}
                onChange={(e) => handleFilterChange(operator, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Filter..."
              />
            )}
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="w-full h-7 text-xs"
            onClick={() => {
              setOperator(defaultOperator);
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

  // Reverse lookup for operator labels can be tricky if we don't know the type here easily.
  // Ideally, we'd pass column configs to this component or look them up from table state if stored.
  // For simplicity, we can just show the operator code or a generic map.
  // Let's optimize by just showing the operator string for now, or a best-effort map.
  const operatorMap: Record<string, string> = {
    eq: "=",
    gt: ">",
    lt: "<",
    gte: ">=",
    lte: "<=",
    contains: "contains",
    starts_with: "starts with",
    ends_with: "ends with",
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2 p-2 bg-muted/20 border rounded-md">
      <span className="text-xs font-medium text-muted-foreground mr-2">
        Active Filters:
      </span>
      {filters.map((filter) => {
        const column = table.getColumn(filter.id);
        const filterValue = filter.value as { operator: string; value: string };
        const opLabel =
          operatorMap[filterValue.operator] || filterValue.operator;

        return (
          <Badge
            key={filter.id}
            variant="secondary"
            className="flex items-center gap-1.5 px-2 py-1 font-normal"
          >
            <span className="font-semibold">{filter.id}:</span>
            <span className="text-muted-foreground">{opLabel}</span>
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
  hideHeaderFilters,
  className,
}: {
  column: Column<TData, unknown>;
  type: ColumnType;
  text: string;
  hideHeaderFilters?: boolean;
  className?: string;
}) => {
  const [open, setOpen] = React.useState(false);
  const isSorted = column.getIsSorted();
  const isFiltered = column.getFilterValue() !== undefined;

  const typeLabel =
    type === "number"
      ? "123"
      : type === "boolean"
        ? "T/F"
        : type === "date" || type === "datetime"
          ? "DATE"
          : "ABC";

  return (
    <div className={cn("group flex items-center w-full gap-1.5", className)}>
      <span className="text-[10px] uppercase text-muted-foreground/70 font-mono tracking-tighter">
        {typeLabel}
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

          {!hideHeaderFilters && <FilterMenu column={column} type={type} />}

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
  data: initialData,
  columns: initialColumns,
  endpoint,
  defaultPageSize = 10,
  params = {},
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange: setControlledColumnFilters,
  onColumnsLoaded,
  hideHeaderFilters = false,
  hideFilterSummary = false,
  // Block pagination defaults
  onNextBlock,
  onPreviousBlock,
  hasMoreBlocks = false,
  hasPreviousBlocks = false,
  serverTotalRows,
  isLoadingPage = false,
  offset = 0,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange: setControlledColumnVisibility,
}: AdvancedDataTableProps<TData>) {
  // State for API mode
  const [data, setData] = React.useState<TData[]>(initialData || []);
  const [columns, setColumns] = React.useState<ColumnConfig<TData>[]>(
    initialColumns || [],
  );
  const [loading, setLoading] = React.useState(false);
  const [totalRows, setTotalRows] = React.useState(0);

  // Table State
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Visibility State
  const [internalColumnVisibility, setInternalColumnVisibility] =
    React.useState<VisibilityState>({});

  const columnVisibility =
    controlledColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility =
    setControlledColumnVisibility ?? setInternalColumnVisibility;

  // Internal filter state if not controlled
  const [internalColumnFilters, setInternalColumnFilters] =
    React.useState<ColumnFiltersState>([]);

  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  const setColumnFilters =
    setControlledColumnFilters ?? setInternalColumnFilters;

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  // State to handle scrolling to last page when loading previous block
  const [shouldScrollToLastPage, setShouldScrollToLastPage] =
    React.useState(false);

  React.useEffect(() => {
    if (shouldScrollToLastPage && !isLoadingPage && data.length > 0) {
      const lastPage = Math.ceil(data.length / pagination.pageSize) - 1;
      if (lastPage >= 0) {
        setPagination((prev) => ({ ...prev, pageIndex: lastPage }));
      }
      setShouldScrollToLastPage(false);
    }
  }, [data, isLoadingPage, shouldScrollToLastPage, pagination.pageSize]);

  const fetchData = React.useCallback(async () => {
    if (!endpoint) return;

    setLoading(true);
    try {
      const { pageIndex, pageSize } = pagination;
      const sort = sorting[0];

      const queryParams = new URLSearchParams();
      queryParams.set("limit", String(pageSize));
      queryParams.set("offset", String(pageIndex * pageSize));

      // Backend Sorting
      if (sort) {
        queryParams.set("sort_by", sort.id);
        queryParams.set("sort_dir", sort.desc ? "desc" : "asc");
      }

      // Backend Filtering
      if (columnFilters.length > 0) {
        const filters = columnFilters
          .map((filter) => {
            const filterValue = filter.value as any;
            const op = filterValue?.operator;
            let value = filterValue?.value;
            const type = filterValue?.type;

            if (
              value === undefined ||
              value === null ||
              String(value).trim() === ""
            ) {
              return null;
            }

            if (type === "number") {
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                value = numValue;
              } else {
                return null;
              }
            }

            return {
              field: filter.id,
              op,
              value,
            };
          })
          .filter((f) => f !== null);

        if (filters.length > 0) {
          queryParams.set("filters", JSON.stringify(filters));
        }
      }

      // Extra params
      Object.entries(params).forEach(([key, value]) => {
        queryParams.set(key, String(value));
      });

      const response = await fetch(`${endpoint}?${queryParams.toString()}`);

      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.error(
            "AdvancedDataTable Fetch Error:",
            JSON.stringify(errorData, null, 2),
          );
        } catch (e) {
          console.error(
            "AdvancedDataTable Fetch Error:",
            response.status,
            response.statusText,
          );
        }
        return;
      }

      const result = await response.json();

      if (result.columns) {
        // Normalize column types
        const normalizedColumns = result.columns.map((col: any) => {
          let type = col.type;
          if (
            [
              "integer",
              "int",
              "float",
              "decimal",
              "double",
              "real",
              "numeric",
            ].includes(String(col.type).toLowerCase())
          ) {
            type = "number";
          }
          return { ...col, type };
        });

        setColumns((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(normalizedColumns))
            return prev;

          return normalizedColumns;
        });
      }
      if (result.data) {
        setData(result.data);
      }
      if (result.meta) {
        setTotalRows(result.meta.total);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, pagination, sorting, columnFilters, params]);

  // Synchronize columns with parent
  React.useEffect(() => {
    if (onColumnsLoaded) {
      onColumnsLoaded(columns);
    }
  }, [columns, onColumnsLoaded]);

  // Sync state with props (fix for external data updates)
  React.useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  React.useEffect(() => {
    if (initialColumns) {
      setColumns(initialColumns);
    }
  }, [initialColumns]);

  // Initial Fetch & Refetch on state change
  React.useEffect(() => {
    if (endpoint) {
      fetchData();
    }
  }, [fetchData, endpoint]);

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
          {endpoint
            ? pagination.pageIndex * pagination.pageSize + row.index + 1
            : offset + row.index + 1}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40, // Compact width for index
    };

    // Data Columns
    const dataCols: ColumnDef<TData>[] = columns.map((col) => ({
      accessorKey: col.key as string,
      header: ({ column }) => (
        <HeaderWithType
          column={column}
          type={col.type}
          text={col.label}
          hideHeaderFilters={hideHeaderFilters}
          className={col.type === "number" ? "justify-end" : ""}
        />
      ),
      enableSorting: col.enableSorting ?? true,
      size: col.width || 120,
      filterFn: (row, columnId, filterValue: any) => {
        // If endpoint is provided, filtering is done server-side
        if (endpoint) return true;

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
            case "gte":
              return numRowValue >= numValue;
            case "lte":
              return numRowValue <= numValue;
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
            case "starts_with":
              return strRowValue.startsWith(strValue);
            case "ends_with":
              return strRowValue.endsWith(strValue);
            case "eq":
              return strRowValue === strValue;
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
              <div
                className={cn(
                  "truncate w-full",
                  col.type === "number" && "text-right font-mono",
                )}
              >
                {value}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{value}</p>
            </TooltipContent>
          </Tooltip>
        );
      },
    }));

    return [indexCol, ...dataCols];
  }, [columns, endpoint, pagination.pageIndex, pagination.pageSize, offset]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    pageCount: endpoint
      ? Math.ceil(totalRows / pagination.pageSize) || 1
      : undefined,
    manualPagination: !!endpoint,
    manualSorting: !!endpoint,
    manualFiltering: !!endpoint,
    defaultColumn: {
      size: 120,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
  });

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* FilterSummary (placeholder for where it would be) */}
      {/* <FilterSummary /> */}

      <div className="flex items-center justify-between px-2 py-2 border-b bg-muted/10 shrink-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Total{" "}
            {endpoint ? totalRows : table.getFilteredRowModel().rows.length}{" "}
            rows
          </span>
          <div className="flex items-center gap-2">
            Rows per page:
            <select
              className="h-6 w-16 rounded border border-input bg-transparent px-1 text-xs"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            Page{" "}
            {Math.floor(offset / table.getState().pagination.pageSize) +
              table.getState().pagination.pageIndex +
              1}{" "}
            of{" "}
            {Math.ceil(
              (serverTotalRows ??
                (endpoint
                  ? totalRows
                  : table.getFilteredRowModel().rows.length)) /
                table.getState().pagination.pageSize,
            ) || 1}
            <span className="text-muted-foreground/50 mx-1">|</span>
            Go to:
            <input
              type="number"
              min={1}
              max={
                Math.ceil(
                  (serverTotalRows ??
                    (endpoint
                      ? totalRows
                      : table.getFilteredRowModel().rows.length)) /
                    table.getState().pagination.pageSize,
                ) || 1
              }
              value={
                Math.floor(offset / table.getState().pagination.pageSize) +
                table.getState().pagination.pageIndex +
                1
              }
              onChange={(e) => {
                const pageSize = table.getState().pagination.pageSize;
                const newGlobalPage = e.target.value
                  ? Number(e.target.value)
                  : 1;
                const globalRowStart = (newGlobalPage - 1) * pageSize;

                if (
                  globalRowStart >= offset &&
                  globalRowStart < offset + data.length
                ) {
                  const newLocalPageIndex =
                    newGlobalPage - 1 - Math.floor(offset / pageSize);
                  table.setPageIndex(newLocalPageIndex);
                }
              }}
              className="h-6 w-12 rounded border border-input bg-transparent px-1 text-xs text-center"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0 lg:flex"
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!table.getCanPreviousPage() && hasPreviousBlocks) {
                  setShouldScrollToLastPage(true);
                  onPreviousBlock?.();
                } else {
                  table.previousPage();
                }
              }}
              disabled={!table.getCanPreviousPage() && !hasPreviousBlocks}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!table.getCanNextPage() && hasMoreBlocks) {
                  onNextBlock?.();
                  table.setPageIndex(0);
                } else {
                  table.nextPage();
                }
              }}
              disabled={!table.getCanNextPage() && !hasMoreBlocks}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0 lg:flex"
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-md border bg-background relative">
        {(loading || isLoadingPage) && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <TooltipProvider>
          <Table className="table-fixed w-max min-w-full border-collapse border border-border">
            <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-b border-border shadow-[0_1px_0_0_theme(colors.border)]"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-8 px-2 border-r border-border text-xs bg-muted/30 font-semibold text-foreground/70"
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
                    className="hover:bg-muted/30 data-[state=selected]:bg-muted/40 border-b border-border/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="h-8 px-2 border-r border-border text-xs p-0 [&>div]:px-2 [&>div]:flex [&>div]:items-center [&>div]:h-full truncate"
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
                    {loading ? "Loading..." : "No results."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>

      <div className="flex items-center justify-between px-2 py-2 border-t bg-muted/10 shrink-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Total{" "}
            {serverTotalRows !== undefined
              ? serverTotalRows
              : endpoint
                ? totalRows
                : table.getFilteredRowModel().rows.length}{" "}
            rows
          </span>
          <div className="flex items-center gap-2">
            Rows per page:
            <select
              className="h-6 w-16 rounded border border-input bg-transparent px-1 text-xs"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            Page{" "}
            {Math.floor(offset / table.getState().pagination.pageSize) +
              table.getState().pagination.pageIndex +
              1}{" "}
            of{" "}
            {Math.ceil(
              (serverTotalRows ??
                (endpoint
                  ? totalRows
                  : table.getFilteredRowModel().rows.length)) /
                table.getState().pagination.pageSize,
            ) || 1}
            <span className="text-muted-foreground/50 mx-1">|</span>
            Go to:
            <input
              type="number"
              min={1}
              max={
                Math.ceil(
                  (serverTotalRows ??
                    (endpoint
                      ? totalRows
                      : table.getFilteredRowModel().rows.length)) /
                    table.getState().pagination.pageSize,
                ) || 1
              }
              value={
                Math.floor(offset / table.getState().pagination.pageSize) +
                table.getState().pagination.pageIndex +
                1
              }
              onChange={(e) => {
                const pageSize = table.getState().pagination.pageSize;
                const newGlobalPage = e.target.value
                  ? Number(e.target.value)
                  : 1;
                const globalRowStart = (newGlobalPage - 1) * pageSize;

                if (
                  globalRowStart >= offset &&
                  globalRowStart < offset + data.length
                ) {
                  const newLocalPageIndex =
                    newGlobalPage - 1 - Math.floor(offset / pageSize);
                  table.setPageIndex(newLocalPageIndex);
                }
              }}
              className="h-6 w-12 rounded border border-input bg-transparent px-1 text-xs text-center"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0 lg:flex"
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!table.getCanPreviousPage() && hasPreviousBlocks) {
                  setShouldScrollToLastPage(true);
                  onPreviousBlock?.();
                } else {
                  table.previousPage();
                }
              }}
              disabled={!table.getCanPreviousPage() && !hasPreviousBlocks}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!table.getCanNextPage() && hasMoreBlocks) {
                  onNextBlock?.();
                  table.setPageIndex(0); // Reset to first page of new block
                } else {
                  table.nextPage();
                }
              }}
              disabled={!table.getCanNextPage() && !hasMoreBlocks}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0 lg:flex"
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
