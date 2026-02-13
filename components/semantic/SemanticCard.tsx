"use client";

import React, { useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  GripVertical,
  MoreVertical,
  Database,
  Clock,
  Type,
  ToggleLeft,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CanvasTablePosition,
  fetchColumns,
  ColumnMetadata,
} from "@/lib/semantic-api";
import { useSemantic } from "@/context/SemanticContext";

interface SemanticCardProps {
  table: CanvasTablePosition;
  onJoinRequest?: (
    srcTableId: string,
    srcTableName: string,
    srcCol: string,
    tgtTableId: string,
    tgtTableName: string,
    tgtCol: string,
  ) => void;
}

export default function SemanticCard({
  table,
  onJoinRequest,
}: SemanticCardProps) {
  const {
    selection,
    setSelection,
    registerTableColumns,
    pendingJoinSource,
    setPendingJoinSource,
    removeTable,
  } = useSemantic();
  const [columns, setColumns] = useState<ColumnMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isSelected = selection?.type === "table" && selection?.id === table.id;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: table.id,
      data: {
        type: "canvas-table",
        ...table,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Load columns on mount
  useEffect(() => {
    async function loadCols() {
      if (!table.table_name) return;
      console.log(
        "SemanticCard loading:",
        table.table_name,
        "Schema:",
        table.schema_name,
      );
      setIsLoading(true);
      try {
        if (!table.schema_name) {
          console.error("Missing schema_name for table:", table.table_name);
          // If we restrict this, old tables might break.
          // But user wants to fix the bug where wrong schema is used.
          // If we fail here, the table won't load columns, which is better than loading wrong ones?
          // Actually, if we default to public, we load wrong ones (empty).
          // If we fail, we show empty. Same result for user?
          // Let's try to fetch with provided schema, if undefined, maybe API handles it?
          // API expects string.
          // Let's THROW if missing, to make it obvious.
          throw new Error("Schema name is missing");
        }
        const cols = await fetchColumns(table.schema_name, table.table_name);
        setColumns(cols);
        registerTableColumns(table.table_name, cols);
      } catch (e) {
        console.error("Failed to load columns for card", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadCols();
  }, [table.table_name, table.schema_name, registerTableColumns]);

  const handleColumnClick = (colName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if we are in "Join Mode" (i.e., pending source set)
    if (pendingJoinSource) {
      if (pendingJoinSource.data.tableId === table.id) {
        // Clicked same table -> Cancel
        setPendingJoinSource(null);
        setSelection(null);
      } else {
        // Clicked different table -> Request Join
        if (onJoinRequest) {
          onJoinRequest(
            pendingJoinSource.data.tableId,
            pendingJoinSource.data.tableName,
            pendingJoinSource.data.columnName,
            table.id,
            table.table_name,
            colName,
          );
        }
        setPendingJoinSource(null);
      }
    } else {
      // Start selection / potential join source
      const selObj: any = {
        type: "column",
        id: `${table.id}:${colName}`,
        data: {
          tableId: table.id,
          tableName: table.table_name,
          columnName: colName,
        },
      };

      setSelection(selObj);
      setPendingJoinSource(selObj);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelection({
      type: "table",
      id: table.id,
      data: table,
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        `Are you sure you want to remove ${table.alias || table.table_name} from the canvas?`,
      )
    ) {
      removeTable(table.id);
    }
  };

  const getDataTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (
      t.includes("int") ||
      t.includes("numeric") ||
      t.includes("float") ||
      t.includes("double")
    ) {
      return <Hash className="w-3 h-3 text-blue-600" />;
    }
    if (t.includes("char") || t.includes("text")) {
      return <Type className="w-3 h-3 text-slate-500" />;
    }
    if (t.includes("date") || t.includes("time") || t.includes("year")) {
      return <Clock className="w-3 h-3 text-orange-600" />;
    }
    if (t.includes("bool")) {
      return <ToggleLeft className="w-3 h-3 text-green-600" />;
    }
    return <Type className="w-3 h-3 text-slate-400" />;
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        left: table.position_x,
        top: table.position_y,
        ...style,
      }}
      className={cn(
        "absolute w-[260px] bg-white border border-blue-200 rounded-lg shadow-sm flex flex-col z-20 pointer-events-auto max-h-[340px]",
        !isDragging && "transition-all duration-200 ease-out", // Only animate when NOT dragging
        isSelected
          ? "ring-2 ring-blue-500 border-blue-500 shadow-lg"
          : "hover:shadow-md hover:border-blue-400",
        isDragging && "opacity-90 z-50 cursor-grabbing shadow-2xl scale-[1.02]", // Add slight scale on drag
      )}
      onClick={handleCardClick}
      data-table-id={table.id} // Hook for JoinLines
      data-table-name={table.table_name} // Hook for JoinLines
    >
      {/* Header - Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className={cn(
          "flex items-center px-3 py-2 border-b bg-gradient-to-b from-white to-slate-50 cursor-grab active:cursor-grabbing rounded-t-lg shrink-0 group relative select-none",
          isSelected && "bg-blue-50",
        )}
      >
        <div className="mr-2 p-1 rounded bg-blue-100 text-blue-600">
          <Database className="h-3.5 w-3.5" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-xs font-bold text-slate-800 truncate"
            title={table.table_name}
          >
            {table.table_name}
          </span>
          {table.alias && (
            <span className="text-[10px] text-slate-500 truncate">
              as {table.alias}
            </span>
          )}
        </div>

        {/* Delete Button - Visible on Hover */}
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-md transition-all absolute right-2 top-2"
          title="Remove Table"
        >
          <span className="text-lg leading-none font-bold">&times;</span>
        </button>
      </div>

      {/* Columns */}
      <div
        id={`${table.id}-columns`}
        className="flex-1 flex flex-col py-1 bg-white rounded-b-lg overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
      >
        {isLoading ? (
          <div className="p-4 text-xs text-muted-foreground text-center">
            Loading columns...
          </div>
        ) : (
          columns.map((col) => {
            const isColSelected = selection?.id === `${table.id}:${col.name}`;
            const isPendingSource =
              pendingJoinSource?.id === `${table.id}:${col.name}`;

            return (
              <div
                key={col.name}
                id={`${table.id}-${col.name}`} // Unique ID for JoinLines
                onClick={(e) => handleColumnClick(col.name, e)}
                // Data attributes kept for reference/debugging
                data-col-name={col.name}
                data-table-id={table.id}
                className={cn(
                  "group flex items-center px-3 py-1.5 cursor-pointer border-l-[3px] border-transparent transition-colors hover:bg-blue-50/50",
                  isColSelected
                    ? "bg-blue-50 border-l-blue-600 text-blue-900"
                    : "text-slate-700",
                  isPendingSource &&
                    "bg-blue-100 border-l-blue-500 animate-pulse",
                )}
              >
                {/* 1. Checkbox (Visual only for now, indicates selection) */}
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded border mr-2 flex items-center justify-center transition-colors",
                    isColSelected || isPendingSource
                      ? "bg-blue-600 border-blue-600"
                      : "border-slate-300 group-hover:border-blue-400 bg-white",
                  )}
                >
                  {(isColSelected || isPendingSource) && (
                    <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />
                  )}
                </div>

                {/* 2. Type Icon */}
                <div
                  className="mr-2 opacity-70 group-hover:opacity-100"
                  title={col.type}
                >
                  {getDataTypeIcon(col.type)}
                </div>

                {/* 3. Column Name */}
                <span
                  className={cn(
                    "flex-1 text-[13px] font-medium truncate select-none",
                    (isColSelected || isPendingSource) && "font-semibold",
                  )}
                >
                  {col.name}
                </span>

                {/* 4. Metadata / Key Icon (e.g. PK/FK) - Placeholder */}
                {/* <div className="ml-2 w-3 h-3 rounded-full bg-yellow-400/20" /> */}

                {/* Connection Anchor Point (Right side) - Invisible but useful for debugging */}
                {/* <div className="w-1 h-1 bg-red-500 opacity-0" /> */}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
