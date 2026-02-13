"use client";

import React, { useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSemantic } from "@/context/SemanticContext";
import { cn } from "@/lib/utils";
import SemanticCard from "@/components/semantic/SemanticCard";
import JoinLines from "./JoinLines";

interface SemanticCanvasProps {
  onJoinRequest?: (
    srcTableId: string,
    srcTableName: string,
    srcCol: string,
    tgtTableId: string,
    tgtTableName: string,
    tgtCol: string,
  ) => void;
}

export default function SemanticCanvas({ onJoinRequest }: SemanticCanvasProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: "canvas-droppable",
  });

  const { canvasTables, setSelection } = useSemantic();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Background grid styling (handled in CSS or inline)

  return (
    <div
      ref={setNodeRef}
      id="semantic-canvas-container"
      className={cn(
        "relative w-full h-full bg-muted/5 overflow-auto",
        isOver && "bg-blue-50/20",
      )}
      onClick={(e) => {
        // Deselect if clicking on empty canvas
        if (e.target === e.currentTarget) {
          setSelection(null);
        }
      }}
    >
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 canvas-overlay pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(#cbd5e1 1.5px, transparent 1.5px), radial-gradient(#cbd5e1 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 10px 10px",
        }}
      />

      {/* Empty State */}
      {canvasTables.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
          <div className="text-center">
            <p className="text-sm font-medium">
              Drag tables here to start modeling
            </p>
          </div>
        </div>
      )}

      {/* Join Lines */}
      <JoinLines />

      {/* Render Tables */}
      <div
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {canvasTables.map((table) => (
          <SemanticCard
            key={table.id}
            table={table}
            onJoinRequest={onJoinRequest}
          />
        ))}
      </div>
    </div>
  );
}
