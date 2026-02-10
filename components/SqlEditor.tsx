"use client";

import * as React from "react";
import {
  ChevronRight,
  ChevronDown,
  Database,
  Table as TableIcon,
  Play,
  Loader2,
  Search,
  GripVertical,
  GripHorizontal,
  Folder,
  FolderOpen,
  LayoutTemplate,
  Scroll,
  Hash,
  Tag,
  Braces,
  Sigma,
  Eye,
  FileText,
  HardDrive,
  Square,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdvancedDataTable } from "@/components/ui/advanced-data-table";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";

// Types
type NodeType =
  | "root"
  | "connection"
  | "database"
  | "folder" // Generic folder like "Schemas"
  | "schema"
  | "category"
  | "table"
  | "view"
  | "materialized-view"
  | "function"
  | "sequence"
  | "index"
  | "type"
  | "aggregate";

interface TreeNode {
  id: string;
  label: string;
  type: NodeType;
  parentId?: string;
  children: string[];
  isExpanded: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  hasError?: boolean;
  metadata?: {
    rowCount?: number;
    returnType?: string;
    table?: string;
    apiPath?: string;
    childType?: NodeType;
    schemaName?: string;
  };
}

type MetadataCache = {
  schemas: string[];
  tables: Record<string, string[]>; // schema -> tables
  columns: Record<string, Record<string, string[]>>; // schema -> table -> columns
};

interface QueryResult {
  id: string; // UUID
  timestamp: number;
  label: string; // e.g. "Result 1"
  query: string; // The SQL executed
  data: any[] | null;
  columns: any[];
  error: string | null;
  executionTime: number | null;
  totalRows: number | undefined;
  queryId: string | null; // Backend ID
  loading: boolean;
  activeQuery: string | null; // Needed for pagination re-fetch
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
}

interface TabState {
  id: string;
  title: string;
  query: string;

  // Results Management
  resultTabs: QueryResult[];
  activeResultId: string | null;
}

interface SqlEditorProps {
  className?: string;
}

interface CategoryDef {
  id: string;
  label: string;
  apiPath: string;
  childType: NodeType;
}

const SCHEMA_CATEGORIES: CategoryDef[] = [
  { id: "tables", label: "Tables", apiPath: "tables", childType: "table" },
  {
    id: "foreign-tables",
    label: "Foreign Tables",
    apiPath: "foreign-tables",
    childType: "table",
  },
  { id: "views", label: "Views", apiPath: "views", childType: "view" },
  {
    id: "materialized-views",
    label: "Materialized Views",
    apiPath: "materialized-views",
    childType: "materialized-view",
  },
  { id: "indexes", label: "Indexes", apiPath: "indexes", childType: "index" },
  {
    id: "functions",
    label: "Functions",
    apiPath: "functions",
    childType: "function",
  },
  {
    id: "sequences",
    label: "Sequences",
    apiPath: "sequences",
    childType: "sequence",
  },
  {
    id: "data-types",
    label: "Data Types",
    apiPath: "data-types",
    childType: "type",
  },
  {
    id: "aggregate-functions",
    label: "Aggregate Functions",
    apiPath: "aggregate-functions",
    childType: "aggregate",
  },
];

// --- Schema Explorer Component ---

const SchemaExplorer = () => {
  const [nodes, setNodes] = React.useState<Record<string, TreeNode>>({
    root: {
      id: "root",
      label: "PostgreSQL",
      type: "connection",
      children: ["db:ipl"],
      isExpanded: true, // Auto-expand root
      isLoading: false,
      isLoaded: true,
    },
    "db:ipl": {
      id: "db:ipl",
      label: "ipl_data",
      type: "database",
      parentId: "root",
      children: ["folder:schemas"],
      isExpanded: true, // Auto-expand DB
      isLoading: false,
      isLoaded: true,
    },
    "folder:schemas": {
      id: "folder:schemas",
      label: "Schemas",
      type: "folder",
      parentId: "db:ipl",
      children: [],
      isExpanded: false,
      isLoading: false,
      isLoaded: false,
    },
  });
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    null,
  );

  const toggleNode = async (nodeId: string) => {
    // Selection Logic: Always select on click
    setSelectedNodeId(nodeId);

    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node) return prev;

      // Toggle expansion
      const nextExpanded = !node.isExpanded;
      return {
        ...prev,
        [nodeId]: { ...node, isExpanded: nextExpanded },
      };
    });

    const node = nodes[nodeId];
    // If we are collapsing, or if it's already loaded/loading, do nothing more (except selection above)
    if (node.isExpanded || node.isLoaded || node.isLoading) return;

    // --- Lazy Loading Logic ---

    // 1. Expand "Schemas" folder -> Fetch /metadata/schemas
    if (node.id === "folder:schemas") {
      setNodes((prev) => ({
        ...prev,
        [nodeId]: { ...prev[nodeId], isLoading: true },
      }));
      try {
        const response = await fetch("http://localhost:8000/metadata/schemas"); // Updated endpoint
        if (response.ok) {
          const data = await response.json();
          const childIds: string[] = [];
          const newNodes: Record<string, TreeNode> = {};

          // Data is array of strings e.g. ["public", "information_schema"]
          data.forEach((schemaName: string) => {
            const id = `schema:${schemaName}`;
            childIds.push(id);
            newNodes[id] = {
              id,
              label: schemaName,
              type: "schema",
              parentId: nodeId,
              children: [],
              isExpanded: false,
              isLoading: false,
              isLoaded: false, // Virtual children not made yet
            };
          });

          setNodes((prev) => ({
            ...prev,
            ...newNodes,
            [nodeId]: {
              ...prev[nodeId],
              isLoaded: true,
              isLoading: false,
              children: childIds,
            },
          }));
        } else {
          throw new Error("Failed to fetch schemas");
        }
      } catch (error) {
        console.error(error);
        setNodes((prev) => ({
          ...prev,
          [nodeId]: { ...prev[nodeId], isLoading: false, hasError: true },
        }));
      }
    }

    // 2. Expand a Schema Node -> Generate Virtual Categories
    else if (node.type === "schema") {
      const childIds: string[] = [];
      const newNodes: Record<string, TreeNode> = {};

      SCHEMA_CATEGORIES.forEach((cat) => {
        const id = `cat:${node.label}:${cat.id}`;
        childIds.push(id);
        newNodes[id] = {
          id,
          label: cat.label,
          type: "category",
          parentId: nodeId,
          children: [],
          isExpanded: false,
          isLoading: false,
          isLoaded: false,
          metadata: {
            apiPath: cat.apiPath,
            childType: cat.childType,
            schemaName: node.label, // Explicitly save schema name
          },
        };
      });

      setNodes((prev) => ({
        ...prev,
        ...newNodes,
        [nodeId]: { ...prev[nodeId], isLoaded: true, children: childIds },
      }));
    }

    // 3. Expand a Category -> Fetch Items
    else if (node.type === "category") {
      setNodes((prev) => ({
        ...prev,
        [nodeId]: { ...prev[nodeId], isLoading: true },
      }));

      try {
        // Robust extraction: Read explicitly from metadata
        let schemaName = node.metadata?.schemaName;

        // Fallback: Parsing current node ID (cat:schema:apiPath)
        if (!schemaName && node.id.startsWith("cat:")) {
          const parts = node.id.split(":");
          if (parts.length >= 2) {
            schemaName = parts[1];
          }
        }

        // Final safe check
        if (!schemaName || schemaName === "undefined") {
          // Last resort try parent
          schemaName = nodes[node.parentId!]?.label;
        }

        if (!schemaName) {
          throw new Error("Could not determine schema name for category node");
        }

        const apiPath = node.metadata?.apiPath;
        const childType = (node.metadata?.childType as NodeType) || "table";

        console.log(`Fetching ${apiPath} for schema: ${schemaName}`); // Debug log

        const response = await fetch(
          `http://localhost:8000/metadata/schemas/${schemaName}/${apiPath}`,
        );
        const data = response.ok ? await response.json() : [];

        const childIds: string[] = [];
        const newNodes: Record<string, TreeNode> = {};

        data.forEach((item: any) => {
          const itemName = typeof item === "string" ? item : item.name;
          const id = `item:${schemaName}:${apiPath}:${itemName}`;
          childIds.push(id);
          newNodes[id] = {
            id,
            label: itemName,
            type: childType,
            parentId: nodeId,
            children: [],
            isExpanded: false,
            isLoading: false,
            isLoaded: true,
            metadata: typeof item === "object" ? item : undefined,
          };
        });

        setNodes((prev) => ({
          ...prev,
          ...newNodes,
          [nodeId]: {
            ...prev[nodeId],
            isLoading: false,
            isLoaded: true,
            children: childIds,
          },
        }));
      } catch (error) {
        console.error(error);
        setNodes((prev) => ({
          ...prev,
          [nodeId]: {
            ...prev[nodeId],
            isLoading: false,
            hasError: true,
          },
        }));
      }
    }
  };

  const getNodeIcon = (node: TreeNode) => {
    switch (node.type) {
      case "connection":
        return HardDrive;
      case "database":
        return Database;
      case "folder":
      case "schema":
        return Folder;
      case "category":
        return node.isExpanded ? FolderOpen : Folder;
      case "table":
        return TableIcon;
      case "view":
        return Eye;
      case "function":
        return Scroll;
      case "sequence":
        return Hash;
      case "index":
        return Tag;
      case "type":
        return FileText;
      case "aggregate":
        return Sigma;
      default:
        return ChevronRight;
    }
  };

  const renderTree = (nodeIds: string[], level = 0) => {
    return nodeIds.map((id) => {
      const node = nodes[id];
      if (!node) return null;

      const Icon = getNodeIcon(node);
      const isLeaf =
        node.type !== "connection" &&
        node.type !== "database" &&
        node.type !== "folder" &&
        node.type !== "schema" &&
        node.type !== "category";

      const showExpand = !isLeaf;
      const isSelected = selectedNodeId === id;

      return (
        <div key={id}>
          <div
            className={cn(
              "flex items-center text-sm py-0.5 pr-2 hover:bg-blue-50 cursor-pointer select-none transition-colors border-l-[2px] border-transparent",
              isSelected && "bg-blue-100 border-blue-600",
              node.hasError && "text-red-600",
            )}
            style={{ paddingLeft: `${level * 16 + 4}px` }}
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(id);
            }}
          >
            {showExpand ? (
              <span className="mr-1 text-muted-foreground/60 shrink-0 hover:text-foreground">
                {node.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : node.isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </span>
            ) : (
              <span className="w-[18px]" />
            )}

            <Icon
              className={cn(
                "h-4 w-4 mr-2 shrink-0",
                node.type === "connection" && "text-slate-700",
                node.type === "database" && "text-blue-600",
                node.type === "schema" && "text-orange-600",
                node.type === "folder" && "text-yellow-600 fill-yellow-50",
                node.type === "category" && "text-yellow-600 fill-yellow-50",
                node.type === "table" && "text-blue-600",
                node.type === "view" && "text-green-600 text-opacity-80",
                node.type === "function" && "text-purple-600",
              )}
            />
            <span
              className={cn(
                "truncate flex-1 font-normal",
                isSelected ? "text-blue-900" : "text-slate-700",
              )}
            >
              {node.label}
            </span>
            {node.metadata?.rowCount !== undefined && (
              <span className="text-[10px] text-muted-foreground ml-2 bg-slate-100 px-1 rounded">
                {node.metadata.rowCount.toLocaleString()}
              </span>
            )}
            {node.hasError && (
              <span className="text-[10px] text-red-500 ml-2">(Error)</span>
            )}
          </div>
          {node.isExpanded && (
            <div>
              {node.children.length > 0 ? (
                renderTree(node.children, level + 1)
              ) : node.isLoaded && node.type === "category" ? (
                <div
                  className="text-[11px] text-muted-foreground/50 italic py-0.5"
                  style={{ paddingLeft: `${(level + 1) * 16 + 24}px` }}
                >
                  No items
                </div>
              ) : null}
            </div>
          )}
        </div>
      );
    });
  };

  // Removed general loading check, as we only load schemas when expanded.
  // Initial root nodes are static.

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="p-2 border-b bg-slate-50 shrink-0 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Database className="h-3.5 w-3.5" />
          Explorer
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto py-2">{renderTree(["root"])}</div>
    </div>
  );
};

// --- SQL Workspace Component ---

import Editor, { OnMount } from "@monaco-editor/react";

const SqlWorkspace = () => {
  const [tabs, setTabs] = React.useState<TabState[]>([
    {
      id: "1",
      title: "Query 1",
      query: "SELECT * FROM ipl_matches LIMIT 10;",
      resultTabs: [],
      activeResultId: null,
    },
  ]);
  const [activeTabId, setActiveTabId] = React.useState<string>("1");
  const activeTabIdRef = React.useRef(activeTabId);

  React.useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  // Get active result or last result
  const activeResult =
    activeTab.resultTabs.find((r) => r.id === activeTab.activeResultId) ||
    activeTab.resultTabs[0];

  const updateTab = (tabId: string, updates: Partial<TabState>) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)),
    );
  };

  const updateResult = (
    tabId: string,
    resultId: string,
    updates: Partial<QueryResult>,
  ) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        return {
          ...tab,
          resultTabs: tab.resultTabs.map((r) =>
            r.id === resultId ? { ...r, ...updates } : r,
          ),
        };
      }),
    );
  };

  const addTab = () => {
    const newId = crypto.randomUUID();
    const newTab: TabState = {
      id: newId,
      title: `Query ${tabs.length + 1}`,
      query: "",
      resultTabs: [],
      activeResultId: null,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (tabs.length === 1) return; // Don't close last tab
    if (tabId === "1") return; // Don't close the first tab

    const index = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      // Switch to previous tab or next one
      const newActiveIndex = Math.max(0, index - 1);
      setActiveTabId(newTabs[newActiveIndex].id);
    }
  };

  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<any>(null);
  const completionDisposition = React.useRef<any>(null); // To store the disposable provider

  // optimized metadata cache
  const metadataCache = React.useRef<MetadataCache>({
    schemas: [],
    tables: {},
    columns: {},
  });

  // Fetch Metadata Logic
  const fetchMetadata = React.useCallback(async () => {
    try {
      // 1. Fetch Schemas
      if (metadataCache.current.schemas.length === 0) {
        const res = await fetch("http://localhost:8000/metadata/schemas");
        if (res.ok) {
          const schemas = await res.json();
          metadataCache.current.schemas = schemas;
        }
      }

      // 2. Fetch Tables for 'public' (eager load)
      if (!metadataCache.current.tables["public"]) {
        const res = await fetch(
          "http://localhost:8000/metadata/schemas/public/tables",
        );
        if (res.ok) {
          const tables = await res.json();
          metadataCache.current.tables["public"] = tables;

          // 3. Eager fetch columns for all known tables in 'public'
          //    This creates a very snappy experience for the default schema
          tables.forEach(async (table: string) => {
            if (!metadataCache.current.columns["public"]?.[table]) {
              const colRes = await fetch(
                `http://localhost:8000/metadata/schemas/public/columns?table=${table}`,
              );
              if (colRes.ok) {
                const cols = await colRes.json();
                // cols is array of objects {name, type, ...} -> mapping to string[]
                const colNames = cols.map((c: any) => c.name);

                if (!metadataCache.current.columns["public"]) {
                  metadataCache.current.columns["public"] = {};
                }
                metadataCache.current.columns["public"][table] = colNames;
              }
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch metadata for autocomplete", e);
    }
  }, []);

  React.useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Create a ref for tabs to avoid stale closures in handleRunQuery
  const tabsRef = React.useRef(tabs);
  React.useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const handleRunQuery = React.useCallback(
    async (mode: "replace" | "new" = "replace", queryText?: string) => {
      let textToRun = queryText;

      if (!textToRun && editorRef.current) {
        const editor = editorRef.current;
        const model = editor.getModel();
        const selection = editor.getSelection();

        if (selection && !selection.isEmpty()) {
          textToRun = model.getValueInRange(selection);
        } else {
          // ... (keep existing selection logic)
          const position = editor.getPosition();
          const fullText = model.getValue();
          const offset = model.getOffsetAt(position);
          const textBefore = fullText.substring(0, offset);
          const textAfter = fullText.substring(offset);
          const statementsBefore = textBefore.split(";");
          const statementsAfter = textAfter.split(";");
          const atomBefore = statementsBefore[statementsBefore.length - 1];
          const atomAfter = statementsAfter[0];
          const isBlank = !atomBefore.trim();
          const hasNewline = atomBefore.includes("\n");
          const hasPrevious = statementsBefore.length > 1;

          if (isBlank && !hasNewline && hasPrevious) {
            const prevStmt = statementsBefore[statementsBefore.length - 2];
            textToRun = prevStmt;
          } else {
            textToRun = atomBefore + atomAfter;
          }
        }
      }

      if (!textToRun || !textToRun.trim()) return;

      const currentTabId = activeTabIdRef.current;
      // Use tabsRef to get the latest state safely without dependency issues
      const currentTabs = tabsRef.current;
      const tab = currentTabs.find((t) => t.id === currentTabId);
      if (!tab) return; // Should not happen

      let targetResultId: string;

      if (mode === "new" || !tab.activeResultId) {
        // Create new result tab
        const newResultId = crypto.randomUUID();
        const newResult: QueryResult = {
          id: newResultId,
          timestamp: Date.now(),
          label: `Result ${tab.resultTabs.length + 1}`,
          query: textToRun, // Store executed query
          data: null,
          columns: [],
          error: null,
          executionTime: null,
          totalRows: undefined,
          queryId: null,
          loading: true,
          activeQuery: textToRun,
          pagination: { pageIndex: 0, pageSize: 10 },
        };

        // Add to tabs and set active
        setTabs((prev) =>
          prev.map((t) => {
            if (t.id !== currentTabId) return t;
            return {
              ...t,
              resultTabs: [...t.resultTabs, newResult],
              activeResultId: newResultId,
            };
          }),
        );
        targetResultId = newResultId;
      } else {
        // Replace current result
        targetResultId = tab.activeResultId;
        updateResult(currentTabId, targetResultId, {
          loading: true,
          error: null,
          data: null,
          columns: [],
          totalRows: undefined,
          executionTime: null,
          queryId: null,
          activeQuery: textToRun,
          pagination: { pageIndex: 0, pageSize: 10 },
          query: textToRun, // Update query text for this result
        });
      }

      const startTime = performance.now();
      const newQueryId = crypto.randomUUID();
      updateResult(currentTabId, targetResultId, { queryId: newQueryId });

      try {
        const response = await fetch("http://localhost:8000/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: textToRun,
            limit: 10,
            offset: 0,
            query_id: newQueryId,
          }),
        });

        const data = await response.json();

        if (data.error) {
          updateResult(currentTabId, targetResultId, { error: data.error });
        } else {
          updateResult(currentTabId, targetResultId, {
            data: data.data,
            columns: data.columns,
            totalRows: data.total_rows,
            executionTime: performance.now() - startTime,
          });
        }
      } catch (err: any) {
        updateResult(currentTabId, targetResultId, {
          error: err.message || "Failed to execute query",
        });
      } finally {
        updateResult(currentTabId, targetResultId, {
          loading: false,
          queryId: null,
        });
      }
    },
    [], // No dependencies needed due to Refs
  );

  const handleCancelQuery = async () => {
    if (!activeResult?.queryId) return;

    try {
      await fetch("http://localhost:8000/query/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query_id: activeResult.queryId,
        }),
      });
      updateResult(activeTab.id, activeResult.id, {
        loading: false,
        error: "Query cancelled",
        queryId: null,
      });
    } catch (error) {
      console.error("Failed to cancel query", error);
    }
  };

  const fetchPage = React.useCallback(
    async (
      tabId: string,
      resultId: string,
      pageIndex: number,
      pageSize: number,
    ) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;
      const result = tab.resultTabs.find((r) => r.id === resultId);
      if (!result || !result.activeQuery) return;

      updateResult(tabId, resultId, { loading: true });

      try {
        const response = await fetch("http://localhost:8000/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: result.activeQuery,
            limit: pageSize,
            offset: pageIndex * pageSize,
          }),
        });

        const data = await response.json();

        if (!data.error) {
          updateResult(tabId, resultId, {
            data: data.data,
            totalRows: data.total_rows,
            pagination: {
              pageIndex,
              pageSize,
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch page", error);
      } finally {
        updateResult(tabId, resultId, { loading: false });
      }
    },
    [tabs],
  );

  const handlePaginationChange = (updaterOrValue: any) => {
    if (!activeResult) return;
    const oldPagination = activeResult.pagination;
    const newPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(oldPagination)
        : updaterOrValue;

    fetchPage(
      activeTab.id,
      activeResult.id,
      newPagination.pageIndex,
      newPagination.pageSize,
    );
  };

  const handleEditorDidMount: OnMount = React.useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Register Completion Provider
      // We perform a check to avoid duplicate registration if this component re-mounts
      // However, monaco.languages.registerCompletionItemProvider is global.
      // Better to dispose it on unmount.

      if (completionDisposition.current) {
        completionDisposition.current.dispose();
      }

      completionDisposition.current =
        monaco.languages.registerCompletionItemProvider("sql", {
          triggerCharacters: [" ", ".", ","],
          provideCompletionItems: (model: any, position: any) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            const fullText = model.getValue();
            const textUntilPosition = model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            });

            const suggestions: any[] = [];

            // Simple Context Detection
            const lowerText = textUntilPosition.toLowerCase();
            const lastToken = lowerText.trim().split(/\s+/).pop();

            // 1. Table Suggestions (Context: FROM, JOIN)
            // Regex checks if we are inside a FROM/JOIN clause
            // Matches "FROM " or "JOIN " optionally followed by schema.
            // Simplified check: last significant keyword
            const isTableContext =
              /from\s+[\w."]*$/i.test(lowerText) ||
              /join\s+[\w."]*$/i.test(lowerText);

            if (isTableContext) {
              // Suggest Schemas
              metadataCache.current.schemas.forEach((schema) => {
                suggestions.push({
                  label: schema,
                  kind: monaco.languages.CompletionItemKind.Module,
                  insertText: schema,
                  detail: "Schema",
                  range,
                });
              });

              // Suggest Tables from 'public' (default)
              // Or suggest tables from specific schema if "schema." is typed (TODO: deeper parsing)
              const publicTables = metadataCache.current.tables["public"] || [];
              publicTables.forEach((table) => {
                suggestions.push({
                  label: table,
                  kind: monaco.languages.CompletionItemKind.Class,
                  insertText: table,
                  detail: "Table",
                  range,
                  sortText: "0" + table, // High priority
                });
              });
            }

            // 2. Column Suggestions (Context: SELECT, WHERE, ON, HAVING, GROUP BY)
            // Basically default to columns if not in table context
            else {
              // Suggest specific keywords? (Optional, Monaco handles basic SQL keywords usually)

              // Suggest Columns from all loaded public tables
              // For a smarter implementation, we would parse "FROM table" to narrow down.
              // For now, flatten all known columns.

              const publicCols = metadataCache.current.columns["public"] || {};
              Object.entries(publicCols).forEach(([table, cols]) => {
                // Add columns
                cols.forEach((col) => {
                  suggestions.push({
                    label: col,
                    kind: monaco.languages.CompletionItemKind.Field,
                    insertText: col,
                    detail: `Column (${table})`,
                    range,
                    sortText: "1" + col,
                  });
                });
              });

              // Also suggest Tables (often useful in SELECT for fully qualified names)
              const publicTables = metadataCache.current.tables["public"] || [];
              publicTables.forEach((table) => {
                suggestions.push({
                  label: table,
                  kind: monaco.languages.CompletionItemKind.Class,
                  insertText: table,
                  detail: "Table",
                  range,
                });
              });
            }

            return { suggestions };
          },
        });

      // Add Ctrl+Enter shortcut using addAction (more robust)
      editor.addAction({
        id: "run-query",
        label: "Run Query",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => {
          handleRunQuery("new"); // Default to "new" mode for Ctrl+Enter
        },
      });
    },
    [handleRunQuery],
  );

  // Cleanup provider on unmount
  React.useEffect(() => {
    return () => {
      if (completionDisposition.current) {
        completionDisposition.current.dispose();
      }
    };
  }, []);

  return (
    <ResizablePanelGroup
      direction="vertical"
      className="h-full overflow-hidden"
      autoSave="sql-workspace-layout"
    >
      {/* Top: Editor */}
      <ResizablePanel
        defaultSize={40}
        minSize={20}
        id="sql-editor-panel"
        className="flex flex-col relative"
      >
        {/* Tab Bar */}
        <div className="flex items-center bg-slate-100 border-b overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer border-r border-slate-200 select-none min-w-[100px] max-w-[200px]",
                activeTabId === tab.id
                  ? "bg-white text-blue-700 font-medium border-t-2 border-t-blue-600"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span className="truncate flex-1">{tab.title}</span>
              {tab.id !== "1" && (
                <div
                  onClick={(e) => closeTab(tab.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-slate-300 md:opacity-0 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}
          <div
            onClick={addTab}
            className="px-2 py-1.5 cursor-pointer hover:bg-slate-200 text-slate-500"
            title="New Query"
          >
            <Plus className="h-4 w-4" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/50 hidden sm:inline-block">
              (Ctrl + Enter to run)
            </span>
          </div>
          {activeResult?.loading && activeResult?.queryId ? (
            <Button
              size="sm"
              onClick={handleCancelQuery}
              className="h-7 bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleRunQuery("replace")}
                disabled={activeResult?.loading}
                className="h-7 bg-green-600 hover:bg-green-700 text-white gap-1.5"
              >
                {activeResult?.loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
                Run
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRunQuery("new")}
                disabled={activeResult?.loading}
                className="h-7 text-xs gap-1.5"
                title="Run in New Tab"
              >
                <Plus className="h-3.5 w-3.5" />
                Run New
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden relative">
          <Editor
            height="100%"
            defaultLanguage="sql"
            // Use path to segregate states (undo/redo stack) per tab
            path={`model-${activeTab.id}.sql`}
            value={activeTab.query}
            onChange={(value) => updateTab(activeTabId, { query: value || "" })}
            onMount={handleEditorDidMount}
            theme="light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              wordWrap: "on",
            }}
          />
        </div>
      </ResizablePanel>

      <ResizableHandle
        withHandle={false}
        className="h-2 w-full bg-slate-50 border-y border-border hover:bg-slate-200 transition-colors z-50 flex items-center justify-center cursor-row-resize group outline-none"
      >
        <div className="h-1 w-10 rounded-full bg-slate-300 group-hover:bg-slate-400/80" />
      </ResizableHandle>

      {/* Bottom: Results */}
      <ResizablePanel
        defaultSize={60}
        minSize={10}
        id="sql-results-panel"
        className="flex flex-col min-h-0 bg-background"
      >
        <div className="flex flex-col border-b bg-muted/10 shrink-0">
          <div className="flex items-center justify-between p-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              Results
            </span>
            {activeResult?.executionTime !== null &&
              !activeResult?.error &&
              activeResult?.data && (
                <span className="text-xs text-muted-foreground">
                  Showing rows{" "}
                  {activeResult.pagination.pageIndex *
                    activeResult.pagination.pageSize +
                    1}
                  -
                  {Math.min(
                    (activeResult.pagination.pageIndex + 1) *
                      activeResult.pagination.pageSize,
                    activeResult.totalRows || 0,
                  )}{" "}
                  of{" "}
                  {activeResult.totalRows !== undefined
                    ? activeResult.totalRows
                    : "?"}{" "}
                  in {activeResult.executionTime?.toFixed(0)}ms
                </span>
              )}
          </div>

          {/* Result Tabs */}
          {activeTab.resultTabs.length > 0 && (
            <div className="flex items-center gap-1 px-2 pb-0 overflow-x-auto no-scrollbar">
              {activeTab.resultTabs.map((result) => (
                <div
                  key={result.id}
                  onClick={() =>
                    updateTab(activeTab.id, { activeResultId: result.id })
                  }
                  className={cn(
                    "group flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer border-t border-x rounded-t-md select-none min-w-[80px] max-w-[200px]",
                    result.id === activeTab.activeResultId
                      ? "bg-background text-foreground font-medium border-b-background z-10 -mb-[1px] border-b-white"
                      : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted/80",
                  )}
                >
                  <span className="truncate">{result.label}</span>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const newTabs = activeTab.resultTabs.filter(
                        (r) => r.id !== result.id,
                      );
                      let newActiveId = activeTab.activeResultId;
                      if (activeTab.activeResultId === result.id) {
                        newActiveId = newTabs[newTabs.length - 1]?.id || null;
                      }
                      updateTab(activeTab.id, {
                        resultTabs: newTabs,
                        activeResultId: newActiveId,
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-slate-300 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden relative p-2 bg-background">
          {!activeResult ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Play className="h-8 w-8 mb-2 opacity-20" />
              <p>Run a query to see results</p>
            </div>
          ) : (
            <>
              {activeResult.loading && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {activeResult.error ? (
                <div className="p-4 text-red-600 bg-red-50 border border-red-100 rounded-md m-2 text-sm font-mono whitespace-pre-wrap">
                  <strong>Error:</strong> {activeResult.error}
                </div>
              ) : activeResult.data ? (
                <AdvancedDataTable
                  columns={activeResult.columns}
                  data={activeResult.data}
                  rowCount={activeResult.totalRows}
                  pagination={activeResult.pagination}
                  onPaginationChange={handlePaginationChange}
                  manualPagination={true}
                />
              ) : null}
            </>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

// --- Main Layout ---

export default function SqlEditor({ className }: SqlEditorProps) {
  return (
    <div
      className={cn(
        "h-full w-full border rounded-lg overflow-hidden bg-background shadow-sm",
        className,
      )}
    >
      <ResizablePanelGroup direction="horizontal" autoSave="sql-main-layout">
        {/* Left Panel: Schema Explorer */}
        <ResizablePanel
          defaultSize={20}
          id="sql-schema-panel"
          className="flex flex-col border-r"
        >
          <SchemaExplorer />
        </ResizablePanel>

        <ResizableHandle className="flex w-4 items-center justify-center bg-transparent hover:bg-blue-50 transition-colors cursor-col-resize outline-none group focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 z-50 -ml-2">
          {/* Vertical Line Indicator */}
          <div className="h-full w-[1px] bg-border group-hover:bg-blue-400 transition-colors" />
        </ResizableHandle>

        {/* Right Panel: SQL Workspace */}
        <ResizablePanel
          defaultSize={80}
          id="sql-workspace-panel"
          className="h-full overflow-hidden"
        >
          <SqlWorkspace />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
