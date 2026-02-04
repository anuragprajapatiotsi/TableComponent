"use client";

import * as React from "react";
import {
  AdvancedDataTable,
  ColumnConfig,
  FILTER_OPERATORS,
  ColumnType,
} from "@/components/ui/advanced-data-table";
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

export default function Home() {
  // --- State ---
  const [mode, setMode] = React.useState<"data" | "analysis">("data");
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

  return (
    <main className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      {/* Enterprise Unified Toolbar (Single Row with Group Headers) */}
      <div className="flex flex-col bg-white border-b shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center justify-between px-4 py-2 gap-4 bg-blue-300 min-h-[72px]">
          {/* LEFT: View Mode & Sections */}
          <div className="flex items-center gap-6">
            {/* View Mode Toggle (Persistent Left) */}
            <div className="flex bg-muted/20 p-1 rounded-lg border border-border/50 self-center">
              <button
                onClick={() => {
                  setMode("analysis");
                  setIsFilterPopoverOpen(false);
                  setIsAIChatOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                  mode === "analysis"
                    ? "bg-white text-blue-600 shadow-sm border border-border/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <BarChart3
                  className={cn(
                    "h-4 w-4",
                    mode === "analysis" ? "text-blue-600" : "",
                  )}
                />
                Story
              </button>
              <button
                onClick={() => {
                  setMode("data");
                  setIsAIChatOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                  mode === "data"
                    ? "bg-white text-blue-600 shadow-sm border border-border/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Search
                  className={cn(
                    "h-4 w-4",
                    mode === "data" ? "text-blue-600" : "",
                  )}
                />
                Data
              </button>
            </div>

            <div className="h-10 w-px bg-border/40 self-center" />

            {/* --- SECTIONS --- */}

            {/* FILE SECTION */}
            <div className="flex flex-col gap-1 items-start">
              <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider px-1">
                File
              </span>
              <div className="flex items-center gap-1">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="h-10 w-px bg-border/40 self-center" />

            {/* INSERT SECTION REMOVED as requested */}

            {/* TOOLS SECTION (Filter Prominent) */}
            <div className="flex flex-col gap-1 items-start">
              <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider px-1">
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
                      className={cn(
                        "h-9 px-3 gap-2 transition-all font-medium border shadow-sm",
                        isFilterPopoverOpen || columnFilters.length > 0
                          ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                          : "bg-white text-foreground hover:bg-muted/50 border-input",
                      )}
                    >
                      <Filter
                        className={cn(
                          "h-4.5 w-4.5",
                          isFilterPopoverOpen || columnFilters.length > 0
                            ? "fill-white/20"
                            : "",
                        )}
                      />
                      <span>Filter</span>
                      {columnFilters.length > 0 && (
                        <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                          {columnFilters.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[480px] p-0 shadow-xl"
                    align="start"
                    sideOffset={8}
                  >
                    <div className="p-3 border-b flex items-center justify-between bg-muted/10">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Filter className="h-4 w-4 text-blue-600" />
                        Advanced Filters
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={handleAddFilterRow}
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[3px]" />
                        <span className="text-xs font-semibold">
                          Add Condition
                        </span>
                      </Button>
                    </div>
                    <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto bg-white">
                      {pendingFilters.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground gap-2">
                          <Filter className="h-8 w-8 opacity-20" />
                          <p>No active filters</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAddFilterRow}
                          >
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
                                className="h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                                className="h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
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
                    <div className="p-3 border-t bg-muted/5 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsFilterPopoverOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApplyFilters}
                        className="bg-blue-600 hover:bg-blue-700 w-24"
                      >
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
                        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        <Sigma className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Formula</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="h-10 w-px bg-border/40 self-center" />

            {/* DATA SECTION */}
            <div className="flex flex-col gap-1 items-start">
              <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider px-1">
                Data
              </span>
              <div className="flex items-center gap-1">
                <Popover open={isColVisOpen} onOpenChange={setIsColVisOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={isColVisOpen ? "secondary" : "ghost"}
                      size="icon-sm"
                      className={cn(
                        "h-9 w-9 transition-colors",
                        isColVisOpen
                          ? "text-blue-600 bg-blue-50 border-blue-200"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <BarChart3
                        className={cn(
                          "h-5 w-5 rotate-90",
                          isColVisOpen ? "stroke-[2.5px]" : "stroke-[2px]",
                        )}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[200px] p-2">
                    <div className="space-y-2">
                      <h4 className="font-medium text-xs text-muted-foreground px-1 mb-2">
                        Toggle Columns
                      </h4>
                      <div className="grid gap-1.5 max-h-[300px] overflow-y-auto">
                        {columns.map((col) => (
                          <label
                            key={String(col.key)}
                            className="flex items-center space-x-2 text-sm px-1 py-0.5 hover:bg-muted rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                              checked={
                                columnVisibility[String(col.key)] !== false
                              }
                              onChange={(e) => {
                                setColumnVisibility((prev) => ({
                                  ...prev,
                                  [String(col.key)]: !!e.target.checked,
                                }));
                              }}
                            />
                            <span className="truncate text-xs">
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
                        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* RIGHT: Global Context */}
          <div className="flex items-center gap-4">
            {/* AI Chat */}
            <Button
              variant={isAIChatOpen ? "secondary" : "ghost"}
              size="icon"
              className={cn(
                "h-10 w-10 transition-colors rounded-full",
                isAIChatOpen
                  ? "text-purple-600 bg-purple-50 border border-purple-200 shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
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

            <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-md border border-border/40">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Dataset:
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-2 font-normal text-foreground p-0 hover:bg-transparent"
                  >
                    <span className="truncate max-w-[120px] font-semibold">
                      {dataset}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {datasets.map((d) => (
                    <DropdownMenuCheckboxItem
                      key={d}
                      checked={dataset === d}
                      onCheckedChange={() => setDataset(d)}
                    >
                      {d}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar (Persistent) */}
      {dataset && columnFilters.length > 0 && (
        <div className="bg-blue-300  border-b px-4 py-2 flex items-center gap-2 min-h-[44px] overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            {columnFilters.map((filter) => {
              const col = columns.find((c) => c.key === filter.id);
              const val = filter.value as any;
              return (
                <div
                  key={filter.id}
                  className="flex items-center bg-blue-50 border border-blue-200 rounded-sm shadow-sm h-7 group"
                >
                  <button
                    onClick={() => setIsFilterPopoverOpen(true)}
                    className="flex items-center px-2.5 h-full text-xs hover:bg-blue-100 transition-colors border-r border-blue-200"
                  >
                    <span className="font-semibold text-blue-700 mr-1.5">
                      {col?.label}
                    </span>
                    <span className="text-blue-600 mr-1.5">
                      ({getOperatorLabel(filter.id, val.operator)})
                    </span>
                    <span className="font-medium text-blue-900">
                      {val.value}
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      setColumnFilters((prev) =>
                        prev.filter((f) => f.id !== filter.id),
                      )
                    }
                    className="h-full px-1.5 hover:bg-blue-500 hover:text-white transition-colors rounded-r-sm text-blue-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
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
                params={{ table: dataset }}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                onColumnsLoaded={setColumns}
                hideHeaderFilters={true}
                hideFilterSummary={true}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground bg-white m-4">
              <div className="text-center space-y-2">
                <div className="bg-blue-50 rounded-full p-4 inline-flex shadow-sm mb-2">
                  <PlayCircle className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="font-medium text-lg text-foreground">
                  Story Mode
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
  );
}
