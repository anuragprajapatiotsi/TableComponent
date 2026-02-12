"use strict";

import React, { useEffect, useState } from "react";
import { useSemantic } from "@/context/SemanticContext";
import {
  fetchSemanticTypes,
  SemanticType,
  ColumnConfigPayload,
  saveColumnConfig,
} from "@/lib/semantic-api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function PropertiesPanel() {
  const { selection, updateColumnConfig, semanticTypes, selectedDataset } =
    useSemantic();

  // Local state for form
  const [displayName, setDisplayName] = useState("");
  const [semanticTypeCode, setSemanticTypeCode] = useState("");
  const [isFilterable, setIsFilterable] = useState(false);

  useEffect(() => {
    if (selection?.type === "column" && selection.data) {
      // Reset form or load existing config if available
      // For now, reset to default/placeholder
      setDisplayName("");
      setSemanticTypeCode("");
      setIsFilterable(false);
    }
  }, [selection]);

  const handleSave = async () => {
    if (!selection || selection.type !== "column" || !selection.data) return;

    const payload: ColumnConfigPayload = {
      table_name: selection.data.tableName,
      column_name: selection.data.columnName,
      display_name: displayName,
      semantic_type: semanticTypeCode,
      is_filterable: isFilterable,
    };

    await updateColumnConfig(payload);
  };

  if (!selection) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground bg-muted/5">
        <p className="text-sm">Select a table or column to view properties</p>
      </div>
    );
  }

  if (selection.type === "table") {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Table Properties</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Table Name</Label>
            <Input
              disabled
              value={selection.data.table_name || ""}
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Alias</Label>
            <Input
              disabled
              value={selection.data.alias || ""}
              className="bg-muted"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Column Properties</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {selection.data.tableName}.{selection.data.columnName}
        </p>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name</Label>
          <Input
            id="display-name"
            placeholder="e.g. Total Revenue"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <Separator />

        {/* Semantic Type */}
        <div className="space-y-2">
          <Label>Semantic Type</Label>
          <select
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={semanticTypeCode}
            onChange={(e) => setSemanticTypeCode(e.target.value)}
          >
            <option value="">Select a type...</option>
            {semanticTypes.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filterable */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is-filterable"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={isFilterable}
            onChange={(e) => setIsFilterable(e.target.checked)}
          />
          <Label htmlFor="is-filterable">Allow Filtering</Label>
        </div>
      </div>

      <div className="p-4 border-t bg-muted/5">
        <Button className="w-full" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
