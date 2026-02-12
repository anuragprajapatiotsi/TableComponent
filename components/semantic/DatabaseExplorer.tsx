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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDraggable } from "@dnd-kit/core";

function DraggableTableItem({
  table,
  isSelected,
  onClick,
  enableDragging = true,
}: {
  table: string;
  isSelected: boolean;
  onClick: () => void;
  enableDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `explorer-table-${table}`,
    data: { type: "explorer-table", tableName: table },
    disabled: !enableDragging,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("touch-none", isDragging && "opacity-50")}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start h-7 text-xs px-2 font-normal group relative",
          isSelected
            ? "bg-blue-50 text-blue-700 font-medium"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={onClick}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-grab">
          <GripVertical className="h-3 w-3 text-muted-foreground/50" />
        </div>
        <Table
          className={cn(
            "h-3.5 w-3.5 mr-2 ml-2 transition-all",
            isSelected ? "text-blue-600" : "opacity-50",
          )}
        />
        {table}
      </Button>
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
    tables,
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
    setSchemaExpanded((prev) => ({ ...prev, [schema]: !prev[schema] }));
    if (schema !== selectedSchema) {
      setSelectedSchema(schema);
    }
  };

  const filteredTables = React.useMemo(() => {
    if (!searchTerm) return tables;
    return tables.filter((t) =>
      t.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [tables, searchTerm]);

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
        {schemas.map((schema) => (
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
                {tables.length === 0 && selectedSchema === schema ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground italic flex items-center">
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" /> Loading
                    tables...
                  </div>
                ) : (
                  filteredTables.map((table) => (
                    <DraggableTableItem
                      key={table}
                      table={table}
                      isSelected={false} // or logic to check selection
                      enableDragging={enableDragging}
                      onClick={() =>
                        setSelection({
                          type: "table",
                          id: `explorer-${table}`,
                          data: { tableName: table },
                        })
                      } // Optional selection logic
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
