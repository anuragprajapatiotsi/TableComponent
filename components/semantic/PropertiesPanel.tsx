"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSemantic } from "@/context/SemanticContext";
import {
  ColumnConfigPayload,
  fetchSemanticColumnTypes,
  GroupedSemanticDefinitions,
} from "@/lib/semantic-api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function PropertiesPanel() {
  const { selection, updateColumnConfig, columnConfigs } = useSemantic();

  // Local state for form
  const [role, setRole] = useState<"Dimension" | "Indicator" | undefined>(
    undefined,
  );
  const [definitionId, setDefinitionId] = useState<string | undefined>(
    undefined,
  );
  const [displayName, setDisplayName] = useState("");
  const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);
  const [groupedDefinitions, setGroupedDefinitions] =
    useState<GroupedSemanticDefinitions>({});

  // Reset form or load existing config when selection changes
  useEffect(() => {
    if (selection?.type === "column" && selection.data) {
      const key = `${selection.data.tableName}:${selection.data.columnName}`;
      const existingConfig = columnConfigs[key];

      if (existingConfig) {
        setRole(existingConfig.role);
        setDefinitionId(existingConfig.definition_id);
        setDisplayName(existingConfig.display_name);
      } else {
        // Default / Blank state
        setRole(undefined);
        setDefinitionId(undefined);
        setDisplayName("");
      }
    }
  }, [selection, columnConfigs]);

  // Fetch definitions when Role changes
  useEffect(() => {
    async function loadDefinitions() {
      if (!role) {
        setGroupedDefinitions({});
        return;
      }
      setIsLoadingDefinitions(true);
      try {
        const data = await fetchSemanticColumnTypes(role);
        if (Array.isArray(data)) {
          // Handle flat list by grouping under "General"
          setGroupedDefinitions({ General: data });
        } else {
          setGroupedDefinitions(data);
        }
      } catch (e) {
        console.error("Failed to load definitions", e);
        setGroupedDefinitions({});
      } finally {
        setIsLoadingDefinitions(false);
      }
    }
    loadDefinitions();
  }, [role]);

  const handleSave = async () => {
    console.log("handleSave triggered", { selection, role, definitionId });
    if (!selection || selection.type !== "column" || !selection.data) return;
    if (!role || !definitionId) {
      alert("Please select a Role and Definition.");
      return;
    }

    const payload: ColumnConfigPayload = {
      table_name: selection.data.tableName,
      column_name: selection.data.columnName,
      display_name: displayName,
      role: role,
      definition_id: definitionId,
    };

    console.log("Saving payload:", payload);
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
    // --- Table Properties (Read Only) ---
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

  // --- Column Properties ---
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Column Properties</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {selection.data.tableName}.{selection.data.columnName}
        </p>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Step 1: Role Selection */}
        <div className="space-y-3">
          <Label>Role</Label>
          <RadioGroup
            value={role}
            onValueChange={(val) => setRole(val as "Dimension" | "Indicator")}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Dimension" id="role-dimension" />
              <Label
                htmlFor="role-dimension"
                className="font-normal cursor-pointer"
              >
                Dimension
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Indicator" id="role-indicator" />
              <Label
                htmlFor="role-indicator"
                className="font-normal cursor-pointer"
              >
                Indicator
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Step 2 & 3: Definition Dropdown */}
        {role && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label>Definition</Label>
            {isLoadingDefinitions ? (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground h-9 border rounded-md px-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading definitions...</span>
              </div>
            ) : (
              <Select
                value={definitionId}
                onValueChange={setDefinitionId}
                disabled={isLoadingDefinitions}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select definition..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedDefinitions).map(
                    ([category, defs]) => (
                      <SelectGroup key={category}>
                        <SelectLabel>{category}</SelectLabel>
                        {defs.map((d: any, index) => {
                          const value = d.id || d.code;
                          const label = d.name || d.label || value;
                          return (
                            <SelectItem
                              key={`${category}-${value || index}`}
                              value={value}
                            >
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    ),
                  )}
                  {Object.keys(groupedDefinitions).length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No definitions found
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Step 4: Display Name */}
        {definitionId && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="e.g. Total Revenue"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-muted/5">
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!role || !definitionId}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
