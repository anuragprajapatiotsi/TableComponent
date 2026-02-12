"use client";

import React from "react";
import { useSemantic } from "@/context/SemanticContext";
import { cn } from "@/lib/utils";
import {
  Save,
  RotateCcw,
  Table,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SemanticEditor() {
  const {
    selectedSchema,
    selectedTable,
    columnMappings,
    isLoadingColumns,
    semanticTypes,
    updateMapping,
    dirtyMappings,
    isDirty,
    saveChanges,
    discardChanges,
  } = useSemantic();

  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveChanges();
    } catch (error) {
      // Error handling is managed in context or via global toast (add toast here if needed)
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedTable) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/5">
        <div className="bg-background p-6 rounded-full shadow-sm mb-4">
          <Table className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium text-foreground">
          No Table Selected
        </h3>
        <p className="text-sm max-w-xs text-center mt-2">
          Select a table from the Database Explorer to configure its semantic
          model.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Table className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {selectedTable}
              <Badge
                variant="outline"
                className="text-xs font-normal text-muted-foreground"
              >
                {selectedSchema}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Define semantic meaning for columns to enhance data exploration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-xs text-amber-600 font-medium flex items-center bg-amber-50 px-2 py-1 rounded-md animate-in fade-in">
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              Unsaved changes
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={discardChanges}
            disabled={!isDirty || isSaving}
            className="text-muted-foreground hover:text-foreground"
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              "gap-2 min-w-[100px]",
              isDirty ? "bg-blue-600 hover:bg-blue-700 text-white" : "",
            )}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Apply Changes
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-auto bg-muted/5 p-6">
        {isLoadingColumns ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs bg-muted/50 text-muted-foreground font-medium uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3 w-1/4">Column Name</th>
                  <th className="px-6 py-3 w-1/6">Database Type</th>
                  <th className="px-6 py-3 w-1/4">Semantic Type</th>
                  <th className="px-6 py-3 w-1/6">Filter UI</th>
                  <th className="px-6 py-3 w-1/6 text-right">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-background">
                {columnMappings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No columns found for this table.
                    </td>
                  </tr>
                ) : (
                  columnMappings.map((col) => {
                    const isModified = dirtyMappings[col.column] !== undefined;
                    // Current semantic type code.
                    // Note: semanticType API returns label (e.g. "date"), but update needs CODE (e.g. "DIM_024").
                    // We need to map back and forth.
                    // However, dirtyMapping stores the CODE.
                    // The API response `semanticType` is likely the LABEL or a simplified code, let's assume it maps to
                    // one of the `semanticTypes` labels.
                    // WAIT: User contract says:
                    // GET /semantic/columns returns `semanticType: "date"` (lowercase label)
                    // GET /semantic/types returns `label: "Date", code: "DIM_024"`
                    // POST /semantic/mapping/bulk needs `sm_code: "DIM_024"`

                    // So we need to find the matching type object based on the lowercase match?

                    const currentTypeCode =
                      dirtyMappings[col.column] ||
                      semanticTypes.find(
                        (t) =>
                          t.label.toLowerCase() ===
                          col.semanticType?.toLowerCase(),
                      )?.code ||
                      // Fallback if no semantic type assigned yet (db default), maybe string?
                      "";

                    const currentTypeObj = semanticTypes.find(
                      (t) => t.code === currentTypeCode,
                    );

                    return (
                      <tr
                        key={col.column}
                        className={cn(
                          "group hover:bg-muted/30 transition-colors",
                          isModified && "bg-blue-50/30",
                        )}
                      >
                        <td className="px-6 py-3 font-medium text-foreground">
                          {col.column}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                          {col.databaseType}
                        </td>
                        <td className="px-6 py-3">
                          <select
                            className={cn(
                              "h-8 w-full max-w-[200px] rounded-md border text-xs px-2 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500",
                              isModified
                                ? "border-blue-300 bg-white ring-1 ring-blue-100"
                                : "border-border bg-transparent",
                            )}
                            value={currentTypeCode}
                            onChange={(e) =>
                              updateMapping(col.column, e.target.value)
                            }
                          >
                            <option value="" disabled>
                              Select Type...
                            </option>
                            {semanticTypes.map((t) => (
                              <option key={t.code} value={t.code}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {currentTypeObj ? (
                            <Badge
                              variant="secondary"
                              className="font-normal text-xs text-foreground/80 opacity-80"
                            >
                              {currentTypeObj.filterType}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {isModified ? (
                            <Badge
                              variant="outline"
                              className="border-blue-200 bg-blue-50 text-blue-700"
                            >
                              Modified
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-normal text-xs",
                                col.source === "semantic"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "text-muted-foreground bg-gray-50/50",
                              )}
                            >
                              {col.source}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
