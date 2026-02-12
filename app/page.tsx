"use client";

import * as React from "react";
import {
  AdvancedDataTable,
  ColumnConfig,
  FILTER_OPERATORS,
  ColumnType,
} from "@/components/ui/advanced-data-table";
import SqlEditor from "@/components/SqlEditor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Search,
  Filter,
  BarChart3,
  Bot,
  PlayCircle,
  X,
  Plus,
  Save,
  Share2,
  Download,
  Sigma,
  RotateCcw,
  Database,
  Settings2,
} from "lucide-react";
import { ColumnFiltersState, VisibilityState } from "@tanstack/react-table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { SemanticProvider } from "@/context/SemanticContext";
import SemanticModeler from "@/components/semantic/SemanticModeler";

export default function Home() {
  // --- State ---
  const [mode, setMode] = React.useState<
    "data" | "analysis" | "sql" | "semantic"
  >("semantic");
  const [dataset, setDataset] = React.useState("ipl_matches");
  const [datasets, setDatasets] = React.useState<string[]>(["ipl_matches"]);

  // Available columns for the current dataset (loaded from table component)
  const [columns, setColumns] = React.useState<ColumnConfig<any>[]>([]);

  // Filter State
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  // Filter Panel State (Popover) - Multi-row
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = React.useState(false);
  const [pendingFilters, setPendingFilters] =
    React.useState<ColumnFiltersState>([]);

  // Column Visibility
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [isColVisOpen, setIsColVisOpen] = React.useState(false);

  // AI Chat
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);

  // --- Effects ---

  React.useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch("http://localhost:8000/tables");
        if (response.ok) {
          const data = await response.json();
          // Assuming data is { tables: string[] } or just string[]
          // Adjust based on actual API response, defaulting to array check
          const tableList = Array.isArray(data) ? data : data.tables || [];
          setDatasets(tableList);
          if (tableList.length > 0 && !tableList.includes(dataset)) {
            setDataset(tableList[0]);
          }
        } else {
          console.error("Failed to fetch tables");
          setDatasets([]);
        }
      } catch (e) {
        console.error("Failed to fetch tables", e);
        setDatasets([]);
      }
    };
    fetchTables();
  }, []);

  // Initialize pending filters when popover opens
  React.useEffect(() => {
    if (isFilterPopoverOpen) {
      setPendingFilters(
        columnFilters.length > 0
          ? columnFilters
          : [
              {
                id: "",
                value: { operator: "eq", value: "" },
              },
            ],
      );
    }
  }, [isFilterPopoverOpen, columnFilters]);

  // Reset filters when dataset changes
  React.useEffect(() => {
    setColumnFilters([]);
    setPendingFilters([]);
  }, [dataset]);

  // --- Handlers ---

  const handleAddFilterRow = () => {
    setPendingFilters([
      ...pendingFilters,
      { id: "", value: { operator: "eq", value: "" } },
    ]);
  };

  const handleUpdateFilterRow = (index: number, field: string, value: any) => {
    const newFilters = [...pendingFilters];
    if (field === "id") {
      const col = columns.find((c) => String(c.key) === value);
      newFilters[index] = {
        ...newFilters[index],
        id: value,
        value: { operator: "eq", value: "", type: col?.type || "string" },
      };
    } else if (field === "operator") {
      newFilters[index] = {
        ...newFilters[index],
        value: { ...(newFilters[index].value as any), operator: value },
      };
    } else if (field === "value") {
      newFilters[index] = {
        ...newFilters[index],
        value: { ...(newFilters[index].value as any), value: value },
      };
    }
    setPendingFilters(newFilters);
  };

  const handleRemoveFilterRow = (index: number) => {
    const newFilters = pendingFilters.filter((_, i) => i !== index);
    setPendingFilters(
      newFilters.length
        ? newFilters
        : [{ id: "", value: { operator: "eq", value: "" } }],
    );
  };

  const handleApplyFilters = () => {
    // Filter out incomplete rows
    const validFilters = pendingFilters.filter(
      (f) => f.id && (f.value as any).value !== "",
    );
    setColumnFilters(validFilters);
    setIsFilterPopoverOpen(false);
  };

  const getColumnType = (key: string) => {
    return columns.find((c) => c.key === key)?.type || "string";
  };

  const getOperators = (columnKey: string) => {
    if (!columnKey) return FILTER_OPERATORS.string; // Default to string operators if no column selected
    const type = getColumnType(columnKey);
    return FILTER_OPERATORS[type] || FILTER_OPERATORS.string;
  };

  const getOperatorLabel = (key: string, opValue: string) => {
    const type = getColumnType(key);
    const ops = FILTER_OPERATORS[type] || FILTER_OPERATORS.string;
    return ops.find((o) => o.value === opValue)?.label || opValue;
  };

  // --- Render ---

  const tableParams = React.useMemo(() => ({ table: dataset }), [dataset]);

  return (
    <SemanticProvider>
      <main className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        {/* Enterprise Unified Toolbar (Single Row with Group Headers) */}
        <div className="flex flex-col bg-white border-b shrink-0 z-20 shadow-sm relative">
          <div className="flex items-center justify-between px-4 py-2 gap-4 bg-blue-50/80 backdrop-blur-sm border-b border-blue-100 min-h-[72px]">
            {/* LEFT: View Mode & Sections */}
            <div className="flex items-center gap-6">
              {/* View Mode Toggle (Persistent Left) */}
              <div className="flex bg-blue-100/50 p-1 rounded-lg border border-blue-200/50 self-center">
                <button
                  onClick={() => {
                    setMode("semantic");
                    setIsFilterPopoverOpen(false);
                    setIsAIChatOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                    mode === "semantic"
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-200"
                      : "text-blue-600/70 hover:text-blue-800 hover:bg-blue-200/50",
                  )}
                >
                  <Settings2
                    className={cn(
                      "h-4 w-4",
                      mode === "semantic"
                        ? "text-blue-600"
                        : "text-blue-600/70",
                    )}
                  />
                  Semantic Modeling
                </button>

                <button
                  onClick={() => {
                    setMode("data");
                    setIsAIChatOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                    mode === "data"
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-200"
                      : "text-blue-600/70 hover:text-blue-800 hover:bg-blue-200/50",
                  )}
                >
                  <Search
                    className={cn(
                      "h-4 w-4",
                      mode === "data" ? "text-blue-600" : "text-blue-600/70",
                    )}
                  />
                  Data
                </button>
                <button
                  onClick={() => {
                    setMode("sql");
                    setIsFilterPopoverOpen(false);
                    setIsAIChatOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                    mode === "sql"
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-200"
                      : "text-blue-600/70 hover:text-blue-800 hover:bg-blue-200/50",
                  )}
                >
                  <Database
                    className={cn(
                      "h-4 w-4",
                      mode === "sql" ? "text-blue-600" : "text-blue-600/70",
                    )}
                  />
                  SQL Editor
                </button>
                <button
                  onClick={() => {
                    setMode("analysis");
                    setIsFilterPopoverOpen(false);
                    setIsAIChatOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                    mode === "analysis"
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-200"
                      : "text-blue-600/70 hover:text-blue-800 hover:bg-blue-200/50",
                  )}
                >
                  <BarChart3
                    className={cn(
                      "h-4 w-4",
                      mode === "analysis"
                        ? "text-blue-600"
                        : "text-blue-600/70",
                    )}
                  />
                  Analysis
                </button>
              </div>

              <div className="h-10 w-px bg-blue-200/50 self-center" />

              {/* --- SECTIONS --- */}

              {/* FILE SECTION */}
              <div className="flex flex-col gap-1 items-start">
                <span className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider px-1">
                  File
                </span>
                <div className="flex items-center gap-1">
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-9 w-9 text-blue-700/70 hover:text-blue-800 hover:bg-blue-100/50"
                        >
                          <Save className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-9 w-9 text-blue-700/70 hover:text-blue-800 hover:bg-blue-100/50"
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Share</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-9 w-9 text-blue-700/70 hover:text-blue-800 hover:bg-blue-100/50"
                        >
                          <Download className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="h-10 w-px bg-blue-200/50 self-center" />

              {/* INSERT SECTION REMOVED as requested */}

              {/* TOOLS SECTION (Filter Prominent) */}
              {mode === "data" && (
                <>
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider px-1">
                      Tools
                    </span>
                    <div className="flex items-center gap-3">
                      {/* Filter Button (Prominent) */}
                      <Popover
                        open={isFilterPopoverOpen}
                        onOpenChange={setIsFilterPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={
                              isFilterPopoverOpen || columnFilters.length > 0
                                ? "secondary"
                                : "ghost"
                            }
                            className={cn(
                              "h-9 px-3 gap-2 transition-all font-medium",
                              isFilterPopoverOpen || columnFilters.length > 0
                                ? "text-blue-700 bg-white border border-blue-200 shadow-sm"
                                : "text-blue-700/70 hover:text-blue-800 hover:bg-blue-100/50",
                            )}
                          >
                            <Filter
                              className={cn(
                                "h-4.5 w-4.5",
                                isFilterPopoverOpen || columnFilters.length > 0
                                  ? "text-blue-600"
                                  : "text-blue-600/70",
                              )}
                            />
                            <span>Filter</span>
                            {columnFilters.length > 0 && (
                              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                                {columnFilters.length}
                              </span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[480px] p-0 shadow-xl border-blue-100"
                          align="start"
                          sideOffset={8}
                        >
                          <div className="p-3 border-b border-blue-100 flex items-center justify-between bg-blue-50/50">
                            <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-900">
                              <Filter className="h-4 w-4 text-blue-600" />
                              Advanced Filters
                            </h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50"
                              onClick={handleAddFilterRow}
                            >
                              <div className="relative mr-0.5 flex items-center">
                                <Filter className="h-3.5 w-3.5" />
                                <div className="absolute -bottom-1 -right-1 bg-blue-100 rounded-full p-[0.5px] border border-white flex items-center justify-center">
                                  <Plus className="h-1.5 w-1.5 text-blue-700 stroke-[4]" />
                                </div>
                              </div>
                              <span className="text-xs font-semibold">
                                Add Condition
                              </span>
                            </Button>
                          </div>
                          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto bg-white">
                            {pendingFilters.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-8 text-sm text-blue-900/40 gap-2">
                                <Filter className="h-8 w-8 opacity-20" />
                                <p>No active filters</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleAddFilterRow}
                                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 gap-2"
                                >
                                  <div className="relative flex items-center">
                                    <Filter className="h-3.5 w-3.5" />
                                    <div className="absolute -bottom-1 -right-1 bg-blue-100 rounded-full p-[0.5px] border border-white flex items-center justify-center">
                                      <Plus className="h-1.5 w-1.5 text-blue-700 stroke-[4]" />
                                    </div>
                                  </div>
                                  Add Condition
                                </Button>
                              </div>
                            )}
                            {pendingFilters.map((row, index) => {
                              const currentValue = (row.value as any) || {};
                              const currentOp = currentValue.operator || "eq";
                              const currentVal = currentValue.value || "";

                              return (
                                <div
                                  key={index}
                                  className="flex gap-2 items-start group animation-in fade-in slide-in-from-top-1"
                                >
                                  <div className="grid grid-cols-[140px_110px_1fr] gap-2 flex-1">
                                    <select
                                      className="h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                                      value={row.id}
                                      onChange={(e) =>
                                        handleUpdateFilterRow(
                                          index,
                                          "id",
                                          e.target.value,
                                        )
                                      }
                                    >
                                      <option value="" disabled>
                                        Column
                                      </option>
                                      {columns.map((col) => (
                                        <option
                                          key={String(col.key)}
                                          value={String(col.key)}
                                        >
                                          {col.label}
                                        </option>
                                      ))}
                                    </select>

                                    <select
                                      className="h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                                      value={currentOp}
                                      onChange={(e) =>
                                        handleUpdateFilterRow(
                                          index,
                                          "operator",
                                          e.target.value,
                                        )
                                      }
                                      disabled={!row.id}
                                    >
                                      {getOperators(row.id).map((op) => (
                                        <option key={op.value} value={op.value}>
                                          {op.label}
                                        </option>
                                      ))}
                                    </select>

                                    <input
                                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 font-medium"
                                      placeholder="Value..."
                                      value={currentVal}
                                      onChange={(e) =>
                                        handleUpdateFilterRow(
                                          index,
                                          "value",
                                          e.target.value,
                                        )
                                      }
                                      disabled={!row.id}
                                    />
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-red-50"
                                    onClick={() => handleRemoveFilterRow(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                          <div className="p-3 border-t border-blue-100 bg-blue-50/30 flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsFilterPopoverOpen(false)}
                              className="text-blue-700 hover:text-blue-800 hover:bg-blue-100/50"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleApplyFilters}
                              className="bg-blue-600 hover:bg-blue-700 w-24 text-white shadow-sm"
                            >
                              <Filter className="h-3.5 w-3.5 mr-2" />
                              Apply
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-9 w-9 text-blue-700/70 hover:text-blue-800 hover:bg-blue-100/50"
                            >
                              <Sigma className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Formula</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-blue-200/50 self-center" />
                </>
              )}

              {/* DATA SECTION */}
              {mode !== "sql" && (
                <>
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-[10px] font-bold text-blue-900/60 uppercase tracking-wider px-1">
                      Data
                    </span>
                    <div className="flex items-center gap-1">
                      <Popover
                        open={isColVisOpen}
                        onOpenChange={setIsColVisOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={isColVisOpen ? "secondary" : "ghost"}
                            size="icon-sm"
                            className={cn(
                              "h-9 w-9 transition-colors",
                              isColVisOpen
                                ? "text-blue-700 bg-white border border-blue-200 shadow-sm"
                                : "text-blue-700/70 hover:text-blue-800 hover:bg-blue-100/50",
                            )}
                          >
                            <BarChart3
                              className={cn(
                                "h-5 w-5 rotate-90",
                                isColVisOpen
                                  ? "stroke-[2.5px]"
                                  : "stroke-[2px]",
                              )}
                            />
                            {Object.values(columnVisibility).filter(
                              (v) => v === false,
                            ).length > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 ring-2 ring-white">
                                {
                                  Object.values(columnVisibility).filter(
                                    (v) => v === false,
                                  ).length
                                }
                              </span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-[200px] p-2 border-blue-100"
                        >
                          <div className="space-y-2">
                            <h4 className="font-medium text-xs text-blue-900 px-1 mb-2">
                              Toggle Columns
                            </h4>
                            <div className="grid gap-1.5 max-h-[300px] overflow-y-auto">
                              {columns.map((col) => (
                                <label
                                  key={String(col.key)}
                                  className="flex items-center space-x-2 text-sm px-1 py-0.5 hover:bg-blue-50 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-400 h-3.5 w-3.5"
                                    checked={
                                      columnVisibility[String(col.key)] !==
                                      false
                                    }
                                    onChange={(e) => {
                                      setColumnVisibility((prev) => ({
                                        ...prev,
                                        [String(col.key)]: !!e.target.checked,
                                      }));
                                    }}
                                  />
                                  <span className="truncate text-xs text-blue-900/80">
                                    {col.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-9 w-9 text-blue-700/70 hover:text-blue-800 hover:bg-blue-100/50"
                            >
                              <RotateCcw className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Refresh</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT: Global Context */}
            <div className="flex items-center gap-4">
              {/* AI Chat - Always Visible */}
              <Button
                variant={isAIChatOpen ? "secondary" : "ghost"}
                size="icon"
                className={cn(
                  "h-10 w-10 transition-colors rounded-full",
                  isAIChatOpen
                    ? "text-purple-600 bg-purple-50 border border-purple-200 shadow-sm"
                    : "text-purple-600/70 hover:bg-purple-50 hover:text-purple-700",
                )}
                onClick={() => setIsAIChatOpen(!isAIChatOpen)}
              >
                <Bot
                  className={cn(
                    "h-6 w-6",
                    isAIChatOpen ? "stroke-[2.5px]" : "stroke-[2px]",
                  )}
                />
              </Button>

              {mode !== "sql" && (
                <div className="flex items-center gap-2 bg-blue-100/30 px-3 py-1.5 rounded-md border border-blue-200/50">
                  <span className="text-xs text-blue-900/60 font-bold uppercase tracking-wider">
                    Dataset:
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-2 font-normal text-blue-900 p-0 hover:bg-transparent"
                      >
                        <span className="truncate max-w-[120px] font-semibold">
                          {dataset}
                        </span>
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-[200px] border-blue-100"
                    >
                      {datasets.map((d) => (
                        <DropdownMenuCheckboxItem
                          key={d}
                          checked={dataset === d}
                          onCheckedChange={() => setDataset(d)}
                          className="text-blue-900 focus:bg-blue-50 focus:text-blue-900"
                        >
                          {d}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar (Persistent) */}
        {mode !== "sql" && dataset && columnFilters.length > 0 && (
          <div className="bg-blue-50/50 backdrop-blur-sm border-b border-blue-100 px-4 py-2 flex items-center gap-2 min-h-[44px] overflow-x-auto shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterPopoverOpen(true)}
                className="h-8 w-8 p-0 text-blue-600 bg-white border border-blue-200 shadow-sm hover:bg-blue-50 hover:text-blue-700 rounded-md transition-all active:scale-95"
              >
                <Filter className="h-4.5 w-4.5" />
              </Button>
              {columnFilters.map((filter) => {
                const col = columns.find((c) => c.key === filter.id);
                const val = filter.value as any;
                return (
                  <div
                    key={filter.id}
                    className="flex items-center bg-white border border-blue-200 rounded-md shadow-sm h-8 group transition-all hover:border-blue-300"
                  >
                    <button
                      onClick={() => setIsFilterPopoverOpen(true)}
                      className="flex items-center px-3 h-full text-xs hover:bg-blue-50 transition-colors border-r border-blue-100 rounded-l-md"
                    >
                      <span className="font-semibold text-blue-700 mr-1.5">
                        {col?.label}
                      </span>
                      <span className="text-blue-600/70 mr-1.5">
                        ({getOperatorLabel(filter.id, val.operator)})
                      </span>
                      <span className="font-medium text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                        {val.value}
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        setColumnFilters((prev) =>
                          prev.filter((f) => f.id !== filter.id),
                        )
                      }
                      className="h-full px-2 hover:bg-red-50 hover:text-red-500 transition-colors rounded-r-md text-blue-300 flex items-center justify-center"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-medium text-blue-600/70 hover:text-red-600 hover:bg-red-50 px-3"
                onClick={() => {
                  setColumnFilters([]);
                  setPendingFilters([]);
                }}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 p-4 bg-muted/5 relative min-h-0 flex overflow-hidden">
          {/* Main Table Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {mode === "data" ? (
              <div className="rounded-lg border bg-card shadow-sm h-full flex flex-col overflow-hidden">
                <AdvancedDataTable
                  endpoint="http://localhost:8000/table"
                  params={tableParams}
                  columnFilters={columnFilters}
                  onColumnFiltersChange={setColumnFilters}
                  onColumnsLoaded={setColumns}
                  hideHeaderFilters={true}
                  hideFilterSummary={true}
                  columnVisibility={columnVisibility}
                  onColumnVisibilityChange={setColumnVisibility}
                />
              </div>
            ) : mode === "sql" ? (
              <div className="h-full rounded-lg border bg-card shadow-sm flex flex-col overflow-hidden">
                <SqlEditor className="h-full border-0 shadow-none" />
              </div>
            ) : mode === "semantic" ? (
              <div className="h-full rounded-lg border bg-card shadow-sm flex flex-col overflow-hidden">
                <SemanticModeler />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground bg-white m-4">
                <div className="text-center space-y-2">
                  <div className="bg-blue-50 rounded-full p-4 inline-flex shadow-sm mb-2">
                    <PlayCircle className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="font-medium text-lg text-foreground">
                    Analysis Mode
                  </h3>
                  <p className="text-sm max-w-sm mx-auto">
                    Build narratives and visualize your data.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI Chat Sidebar */}
          <div
            className={cn(
              "border-l bg-background transition-all duration-300 ease-in-out flex flex-col shadow-xl z-20",
              isAIChatOpen
                ? "w-[350px] translate-x-0"
                : "w-0 translate-x-full opacity-0 overflow-hidden",
            )}
          >
            <div className="flex items-center justify-between p-3 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">AI Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6"
                onClick={() => setIsAIChatOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="bg-muted/30 p-3 rounded-lg text-xs leading-relaxed text-muted-foreground">
                Hello! I can help you analyze the{" "}
                <span className="font-semibold text-foreground">{dataset}</span>{" "}
                dataset. Try asking:
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li>Show top 5 players by runs</li>
                  <li>Compare winning percentage of teams</li>
                  <li>Visualize run rate over years</li>
                </ul>
              </div>
            </div>

            <div className="p-3 border-t">
              <div className="relative">
                <input
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Ask anything..."
                />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="absolute right-1 top-1 h-7 w-7 text-primary"
                >
                  <PlayCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </SemanticProvider>
  );
}
