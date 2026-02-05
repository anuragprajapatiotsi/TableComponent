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
type SchemaMap = Record<string, string[]>;

interface SqlEditorProps {
  className?: string;
}

// --- Schema Explorer Component ---

const SchemaExplorer = () => {
  const [schemas, setSchemas] = React.useState<SchemaMap>({});
  const [loading, setLoading] = React.useState(true);
  const [expandedSchemas, setExpandedSchemas] = React.useState<
    Record<string, boolean>
  >({});

  React.useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const response = await fetch("http://localhost:8000/schemas");
        if (response.ok) {
          const data = await response.json();
          setSchemas(data);
          // Auto-expand the first schema
          if (Object.keys(data).length > 0) {
            setExpandedSchemas({ [Object.keys(data)[0]]: true });
          }
        }
      } catch (error) {
        console.error("Failed to fetch schemas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemas();
  }, []);

  const toggleSchema = (schema: string) => {
    setExpandedSchemas((prev) => ({
      ...prev,
      [schema]: !prev[schema],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading schemas...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="p-3 border-b bg-white shrink-0">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Database className="h-3.5 w-3.5" />
          Explorer
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(schemas).map(([schema, tables]) => (
          <div key={schema} className="mb-2">
            <button
              onClick={() => toggleSchema(schema)}
              className="flex items-center w-full text-sm font-medium text-foreground hover:bg-muted/50 p-1.5 rounded-md transition-colors"
            >
              {expandedSchemas[schema] ? (
                <ChevronDown className="h-4 w-4 mr-1 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1 text-muted-foreground" />
              )}
              <Database className="h-3.5 w-3.5 mr-2 text-blue-600" />
              {schema}
              <span className="ml-auto text-xs text-muted-foreground">
                {tables.length}
              </span>
            </button>

            {expandedSchemas[schema] && (
              <div className="ml-4 mt-1 space-y-0.5 pl-2 border-l border-muted/50">
                {tables.map((table) => (
                  <div
                    key={table}
                    className="flex items-center text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 p-1.5 rounded-md cursor-pointer group"
                    title={table}
                  >
                    <TableIcon className="h-3.5 w-3.5 mr-2 text-blue-400 group-hover:text-blue-600" />
                    <span className="truncate">{table}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- SQL Workspace Component ---

import Editor, { OnMount } from "@monaco-editor/react";

const SqlWorkspace = () => {
  const [query, setQuery] = React.useState(
    "SELECT * FROM ipl_matches LIMIT 10;",
  );
  const [results, setResults] = React.useState<any[] | null>(null);
  const [columns, setColumns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [executionTime, setExecutionTime] = React.useState<number | null>(null);

  const editorRef = React.useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add Ctrl+Enter shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunQuery(editor.getValue());
    });
  };

  const handleRunQuery = async (queryText?: string) => {
    // If specific text is passed (e.g. from Ctrl+Enter inside effect), use it on priority
    // Otherwise check selection, then full value
    let textToRun = queryText;

    if (!textToRun && editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();

      if (selection && !selection.isEmpty()) {
        textToRun = model.getValueInRange(selection);
      } else {
        textToRun = editorRef.current.getValue();
      }
    }

    // Fallback or empty check
    if (!textToRun || !textToRun.trim()) return;

    // Update state to match running query (optional, keeps UI in sync)
    setQuery(editorRef.current?.getValue() || "");

    setLoading(true);
    setError(null);
    setResults(null);
    const startTime = performance.now();

    try {
      const response = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: textToRun }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.data);
        setColumns(data.columns);
        setExecutionTime(performance.now() - startTime);
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResizablePanelGroup
      direction="vertical"
      className="h-full"
      autoSave="sql-workspace-layout"
    >
      {/* Top: Editor */}
      <ResizablePanel
        defaultSize={40}
        minSize={20}
        id="sql-editor-panel"
        className="flex flex-col relative"
      >
        <div className="flex items-center justify-between p-2 border-b bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              Query Editor
            </span>
            <span className="text-[10px] text-muted-foreground/50 hidden sm:inline-block">
              (Ctrl + Enter to run)
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => handleRunQuery()}
            disabled={loading}
            className="h-7 bg-green-600 hover:bg-green-700 text-white gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            Run
          </Button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <Editor
            height="100%"
            defaultLanguage="sql"
            defaultValue={query}
            value={query}
            onChange={(value) => setQuery(value || "")}
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

      <ResizableHandle withHandle />

      {/* Bottom: Results */}
      <ResizablePanel
        defaultSize={60}
        minSize={10}
        id="sql-results-panel"
        className="flex flex-col min-h-0 bg-background"
      >
        <div className="flex items-center justify-between p-2 border-b bg-muted/10 shrink-0">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Results
          </span>
          {executionTime !== null && !error && (
            <span className="text-xs text-muted-foreground">
              {results?.length || 0} rows in {executionTime.toFixed(0)}ms
            </span>
          )}
        </div>

        <div className="flex-1 overflow-hidden relative p-2">
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error ? (
            <div className="p-4 text-red-600 bg-red-50 border border-red-100 rounded-md m-2 text-sm font-mono whitespace-pre-wrap">
              <strong>Error:</strong> {error}
            </div>
          ) : results ? (
            <AdvancedDataTable
              data={results}
              columns={columns}
              // We pass data directly, so it's client-side mode
              endpoint=""
              hideHeaderFilters={false}
              hideFilterSummary={false}
              defaultPageSize={10}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>Execute a query to see results</p>
              </div>
            </div>
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
          minSize={15}
          id="sql-schema-panel"
          className="flex flex-col border-r"
        >
          <SchemaExplorer />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: SQL Workspace */}
        <ResizablePanel
          defaultSize={80}
          id="sql-workspace-panel"
          className="h-full"
        >
          <SqlWorkspace />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
