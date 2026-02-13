"use client";

import React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import DatabaseExplorer from "./DatabaseExplorer";
import SemanticCanvas from "./SemanticCanvas";
import PropertiesPanel from "./PropertiesPanel";
import JoinDialog from "@/components/semantic/JoinDialog";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { useSemantic } from "@/context/SemanticContext";

export default function SemanticModeler() {
  const { dropTableOnCanvas, updateTablePosition } = useSemantic();

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeType, setActiveType] = React.useState<
    "explorer" | "canvas" | null
  >(null);
  const [activeData, setActiveData] = React.useState<any>(null);
  const [isResizing, setIsResizing] = React.useState(false);

  const [joinDialog, setJoinDialog] = React.useState<{
    isOpen: boolean;
    sourceTableId: string;
    sourceTableName: string;
    sourceColumn: string;
    targetTableId: string;
    targetTableName: string;
    targetColumn: string;
  }>({
    isOpen: false,
    sourceTableId: "",
    sourceTableName: "",
    sourceColumn: "",
    targetTableId: "",
    targetTableName: "",
    targetColumn: "",
  });

  const handleJoinRequest = (
    srcTableId: string,
    srcTableName: string,
    srcCol: string,
    tgtTableId: string,
    tgtTableName: string,
    tgtCol: string,
  ) => {
    setJoinDialog({
      isOpen: true,
      sourceTableId: srcTableId,
      sourceTableName: srcTableName,
      sourceColumn: srcCol,
      targetTableId: tgtTableId,
      targetTableName: tgtTableName,
      targetColumn: tgtCol,
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isResizing ? 10000 : 8,
      },
    }),
  );

  // Reset resizing state on global pointer up to prevent getting stuck
  React.useEffect(() => {
    const handleGlobalPointerUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener("pointerup", handleGlobalPointerUp);
    }
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [isResizing]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    if (active.data.current?.type === "explorer-table") {
      setActiveType("explorer");
      setActiveData(active.data.current);
    } else if (active.data.current?.type === "canvas-table") {
      setActiveType("canvas");
      setActiveData(active.data.current);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over, delta } = event;
    setActiveId(null);
    setActiveType(null);
    setActiveData(null);

    if (!over) return;

    // SCENARIO 1: Dropping a new table from Explorer to Canvas
    if (
      active.data.current?.type === "explorer-table" &&
      over.id === "canvas-droppable"
    ) {
      const tableName = active.data.current.tableName;
      const schema = active.data.current.schema;
      // Calculate drop position relative to canvas requires refs, simplified for now
      // We will assume a default or use mouse delta if possible, but delta is 0 for new drag?
      // Actually standard drop logic might need client offsets.
      // Dnd-kit provides activatorEvent, we can approximate or just drop at center/top-left + offset
      // For now, hardcode 100, 100 or random to ensure visibility
      dropTableOnCanvas(
        tableName,
        schema,
        100 + Math.random() * 50,
        100 + Math.random() * 50,
      );
    }

    // SCENARIO 2: Moving an existing table on Canvas
    if (active.data.current?.type === "canvas-table") {
      const tableId = active.id as string;
      const currentX = Number(active.data.current.position_x) || 0;
      const currentY = Number(active.data.current.position_y) || 0;

      updateTablePosition(tableId, currentX + delta.x, currentY + delta.y);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 min-h-0 w-full bg-background flex flex-col min-w-0 ">
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 min-h-0 min-w-0 flex"
        >
          {/* LEFT PANEL: Explorer */}
          <ResizablePanel
            defaultSize={20}
            // minSize={15}
            // maxSize={80}
            className="border-r min-w-0"
          >
            <DatabaseExplorer enableDragging={true} />
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="bg-border hover:bg-blue-400 transition-colors"
            onPointerDown={() => setIsResizing(true)}
            onPointerUp={() => setIsResizing(false)}
            onPointerCancel={() => setIsResizing(false)}
          />

          {/* CENTER PANEL: Canvas */}
          <ResizablePanel defaultSize={60} minSize={30} className="min-w-0">
            <SemanticCanvas onJoinRequest={handleJoinRequest} />
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="bg-border hover:bg-blue-400 transition-colors"
            onPointerDown={() => setIsResizing(true)}
            onPointerUp={() => setIsResizing(false)}
            onPointerCancel={() => setIsResizing(false)}
          />

          {/* RIGHT PANEL: Properties */}
          <ResizablePanel
            defaultSize={20}
            // minSize={15}
            // maxSize={30}
            className="border-l min-w-0"
          >
            <PropertiesPanel />
          </ResizablePanel>
        </ResizablePanelGroup>

        <JoinDialog
          isOpen={joinDialog.isOpen}
          onClose={() => setJoinDialog((prev) => ({ ...prev, isOpen: false }))}
          sourceTableId={joinDialog.sourceTableId}
          sourceTableName={joinDialog.sourceTableName}
          sourceColumn={joinDialog.sourceColumn}
          targetTableId={joinDialog.targetTableId}
          targetTableName={joinDialog.targetTableName}
          targetColumn={joinDialog.targetColumn}
        />

        <DragOverlay>
          {activeId ? (
            activeType === "explorer" ? (
              <div className="bg-background border rounded shadow-md px-3 py-1.5 flex items-center gap-2 opacity-80 cursor-grabbing">
                <span className="text-xs font-medium">
                  {activeData?.tableName}
                </span>
              </div>
            ) : activeType === "canvas" ? (
              <div className="opacity-80">
                <div className="w-[220px] bg-card border rounded-lg shadow-xl flex flex-col p-2 cursor-grabbing">
                  <div className="flex items-center border-b pb-2 mb-2">
                    <span className="font-semibold text-xs truncate flex-1">
                      {activeData?.alias || activeData?.table_name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Moving...</div>
                </div>
              </div>
            ) : null
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
