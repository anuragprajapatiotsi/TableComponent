"use strict";

import React from "react";
import { useSemantic } from "@/context/SemanticContext";
import { cn } from "@/lib/utils";
import {
  Database,
  Table,
  ChevronRight,
  ChevronDown,
  Search,
  Loader2,
  GripVertical,
  Columns,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDraggable } from "@dnd-kit/core";
import { fetchColumns, ColumnMetadata } from "@/lib/semantic-api";

function DraggableTableItem({
  table,
  schema,
  isSelected,
  onClick,
  enableDragging = true,
}: {
  table: string;
  schema: string;
  isSelected: boolean;
  onClick: () => void;
  enableDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `explorer-table-${schema}-${table}`,
    data: { type: "explorer-table", tableName: table, schema },
    disabled: !enableDragging,
  });

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [columns, setColumns] = React.useState<ColumnMetadata[]>([]);
  const [loading, setLoading] = React.useState(false);

  const toggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      if (columns.length === 0) {
        setLoading(true);
        try {
          const cols = await fetchColumns(schema, table);
          setColumns(cols);
        } catch (err) {
          console.error("Failed to fetch columns", err);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn("touch-none", isDragging && "opacity-50")}
    >
      <div
        className={cn(
          "w-full flex items-center h-7 text-xs px-2 group relative hover:bg-muted/50 rounded-sm cursor-pointer",
          isSelected
            ? "bg-blue-50 text-blue-700 font-medium"
            : "text-foreground",
        )}
        onClick={onClick}
      >
        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className="mr-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex items-center justify-center p-0.5"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground/50" />
        </div>

        {/* Expand/Collapse */}
        <div
          role="button"
          onClick={toggleExpand}
          className="mr-1 p-0.5 hover:bg-muted rounded-sm cursor-pointer"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </div>

        {/* Table Icon & Name */}
        <div className="flex items-center flex-1 min-w-0">
          <Table
            className={cn(
              "h-3.5 w-3.5 mr-2 transition-all flex-shrink-0",
              isSelected ? "text-blue-600" : "opacity-50",
            )}
          />
          <span className="truncate" title={table}>
            {table}
          </span>
        </div>
      </div>

      {/* Columns List */}
      {isExpanded && (
        <div className="ml-8 border-l border-border/50 pl-2 mt-0.5 space-y-0.5">
          {loading ? (
            <div className="flex items-center text-[10px] text-muted-foreground py-1">
              <Loader2 className="h-2.5 w-2.5 mr-1.5 animate-spin" />
              Loading columns...
            </div>
          ) : columns.length === 0 ? (
            <div className="text-[10px] text-muted-foreground py-1 italic">
              No columns found
            </div>
          ) : (
            columns.map((col) => (
              <div
                key={col.name}
                className="flex items-center text-[10px] text-muted-foreground hover:text-foreground py-0.5 px-1 rounded-sm hover:bg-muted/50 cursor-default"
                title={`${col.name} (${col.type})`}
              >
                <Columns className="h-3 w-3 mr-1.5 opacity-50" />
                <span className="truncate flex-1">{col.name}</span>
                <span className="text-[9px] opacity-50 ml-1.5 font-mono">
                  {col.type}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface DatabaseExplorerProps {
  enableDragging?: boolean;
}

export default function DatabaseExplorer({
  enableDragging = true,
}: DatabaseExplorerProps) {
  const {
    schemas,
    tablesBySchema,
    selectedSchema,
    setSelectedSchema,
    selection,
    setSelection,
  } = useSemantic();

  const [schemaExpanded, setSchemaExpanded] = React.useState<
    Record<string, boolean>
  >({});
  const [searchTerm, setSearchTerm] = React.useState("");

  // Expand selected schema by default
  React.useEffect(() => {
    if (selectedSchema) {
      setSchemaExpanded((prev) => ({ ...prev, [selectedSchema]: true }));
    }
  }, [selectedSchema]);

  const toggleSchema = (schema: string) => {
    if (schemaExpanded[schema]) {
      setSchemaExpanded({});
    } else {
      setSchemaExpanded({ [schema]: true });
      setSelectedSchema(schema);
    }
  };

  return (
    <div className="flex flex-col h-full border-r bg-muted/10">
      <div className="p-3 border-b bg-background/50 backdrop-blur-sm">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Database Explorer
        </h3>
        <div className="relative">
          <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            className="w-full h-8 pl-8 pr-2 text-xs rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {schemas.map((schema) => {
          const schemaTables = tablesBySchema[schema] || [];
          const visibleTables = searchTerm
            ? schemaTables.filter((t) =>
                t.toLowerCase().includes(searchTerm.toLowerCase()),
              )
            : schemaTables;

          return (
            <div key={schema} className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start h-7 text-xs font-medium px-1",
                  selectedSchema === schema
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => toggleSchema(schema)}
              >
                {schemaExpanded[schema] ? (
                  <ChevronDown className="h-3.5 w-3.5 mr-1 opacity-50" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 mr-1 opacity-50" />
                )}
                <Database className="h-3.5 w-3.5 mr-2 text-blue-500" />
                {schema}
              </Button>

              {schemaExpanded[schema] && (
                <div className="ml-4 pl-2 border-l border-border/50 space-y-0.5">
                  {visibleTables.length === 0 && selectedSchema === schema ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground italic flex items-center">
                      <LoadingOrEmpty
                        loading={schemaTables.length === 0}
                        searchTerm={searchTerm}
                      />
                    </div>
                  ) : (
                    visibleTables.map((table) => (
                      <DraggableTableItem
                        key={table}
                        table={table}
                        schema={schema}
                        isSelected={false} // or logic to check selection
                        enableDragging={enableDragging}
                        onClick={() =>
                          setSelection({
                            type: "table",
                            id: `explorer-${table}`,
                            data: { tableName: table, schema },
                          })
                        } // Optional selection logic
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingOrEmpty({
  loading,
  searchTerm,
}: {
  loading: boolean;
  searchTerm: string;
}) {
  if (loading) {
    return (
      <>
        <Loader2 className="h-3 w-3 mr-2 animate-spin" /> Loading tables...
      </>
    );
  }
  if (searchTerm) {
    return <span>No matches found</span>;
  }
  return <span>No tables found</span>;
}
