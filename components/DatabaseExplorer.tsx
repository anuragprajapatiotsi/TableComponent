"use strict";

import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Database,
  Table as TableIcon,
  Loader2,
  Folder,
  FolderOpen,
  Hash,
  Tag,
  Sigma,
  Eye,
  FileText,
  HardDrive,
  Scroll,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";

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

interface DatabaseExplorerProps {
  className?: string;
  enableDragging?: boolean;
}

export default function DatabaseExplorer({
  className,
  enableDragging = false,
}: DatabaseExplorerProps) {
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
        const response = await fetch("http://localhost:8000/metadata/schemas");
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
            metadata: {
              ...(typeof item === "object" ? item : {}),
              schemaName, // Ensure schema name is passed down
            },
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
        <ExplorerNode
          key={id}
          node={node}
          level={level}
          isSelected={isSelected}
          showExpand={showExpand}
          Icon={Icon}
          onToggle={toggleNode}
          enableDragging={enableDragging}
          renderChildren={() =>
            node.isExpanded ? (
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
            ) : null
          }
        />
      );
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white text-slate-900 border-r",
        className,
      )}
    >
      <div className="p-2 border-b bg-slate-50 shrink-0 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Database className="h-3.5 w-3.5" />
          Explorer
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto py-2">{renderTree(["root"])}</div>
    </div>
  );
}

// Sub-component for individual nodes to handle dragging hooks cleanly
function ExplorerNode({
  node,
  level,
  isSelected,
  showExpand,
  Icon,
  onToggle,
  enableDragging,
  renderChildren,
}: {
  node: TreeNode;
  level: number;
  isSelected: boolean;
  showExpand: boolean;
  Icon: React.ElementType;
  onToggle: (id: string) => void;
  enableDragging: boolean;
  renderChildren: () => React.ReactNode;
}) {
  const isDraggable = enableDragging && node.type === "table";

  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id: node.id,
      disabled: !isDraggable,
      data: {
        type: "explorer-table",
        tableName: node.label,
        schema: node.metadata?.schemaName || "public", // Pass schema if available
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 9999, // Ensure it's above everything when dragging
      }
    : undefined;

  return (
    <div>
      <div
        ref={isDraggable ? setNodeRef : undefined}
        // Only attach listeners if draggable
        {...(isDraggable ? listeners : {})}
        {...(isDraggable ? attributes : {})}
        style={{ ...style, paddingLeft: `${level * 16 + 4}px` }} // Merge padding with transform style
        onClick={(e) => {
          e.stopPropagation();
          onToggle(node.id);
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
      {renderChildren()}
    </div>
  );
}
