"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSemantic } from "@/context/SemanticContext";

export default function JoinLines() {
  const { joins, removeJoin, canvasTables } = useSemantic();
  const [lines, setLines] = useState<
    Array<{
      id: string;
      path: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      join: any;
    }>
  >([]);

  // Use refs to access latest state inside animation frame without restarting the loop
  const joinsRef = useRef(joins);
  const tablesRef = useRef(canvasTables);

  // Update refs when state changes
  useEffect(() => {
    joinsRef.current = joins;
    tablesRef.current = canvasTables;
  }, [joins, canvasTables]);

  // We need to re-calculate lines on various events:
  // 1. Scrolling (window or container)
  // 2. Dragging (dnd-kit events - tricky to hook into from here without context, but RAF helps)
  // 3. Resize
  // 4. Data changes (joins, tables)

  const requestRef = useRef<number>(undefined);

  const calculateLines = () => {
    const currentJoins = joinsRef.current; // access via ref
    const currentTables = tablesRef.current; // access via ref

    const newLines = [];
    const container = document.getElementById("semantic-canvas-container");
    if (!container) return; // Wait for container

    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    for (const join of currentJoins) {
      // Find the table objects first to get their IDs
      // joins only store table names, so we need to map name -> id
      const leftTable = currentTables.find(
        (t) => t.id === join.left_dataset_table_id,
      );
      const rightTable = currentTables.find(
        (t) => t.id === join.right_dataset_table_id,
      );

      if (!leftTable || !rightTable) continue;

      // Use the unique IDs we attached to the column rows: `${tableId}-${colName}`
      const srcNode = document.getElementById(
        `${leftTable.id}-${join.left_column}`,
      );
      const tgtNode = document.getElementById(
        `${rightTable.id}-${join.right_column}`,
      );

      // Also get the scrollable containers to check for visibility/clipping
      // IDs: ${tableId}-columns
      const srcBody = document.getElementById(`${leftTable.id}-columns`);
      const tgtBody = document.getElementById(`${rightTable.id}-columns`);

      if (srcNode && tgtNode && srcBody && tgtBody) {
        const srcRect = srcNode.getBoundingClientRect();
        const tgtRect = tgtNode.getBoundingClientRect();
        const srcBodyRect = srcBody.getBoundingClientRect();
        const tgtBodyRect = tgtBody.getBoundingClientRect();

        // Calculate relative coordinates within the scrollable container
        // x = (el.left - container.left) + container.scrollLeft
        // y = (el.top - container.top) + container.scrollTop

        // Standard anchor: Right edge of source, Left edge of target.
        // We use the full node width, so "Right" edge is the right border of the card row.
        const x1 = srcRect.right - containerRect.left + scrollLeft;
        let y1 =
          srcRect.top + srcRect.height / 2 - containerRect.top + scrollTop;

        const x2 = tgtRect.left - containerRect.left + scrollLeft;
        let y2 =
          tgtRect.top + tgtRect.height / 2 - containerRect.top + scrollTop;

        // --- Clamping Logic ---
        // Convert body rects to canvas coordinates
        const srcBodyTop = srcBodyRect.top - containerRect.top + scrollTop;
        const srcBodyBottom =
          srcBodyRect.bottom - containerRect.top + scrollTop;
        const tgtBodyTop = tgtBodyRect.top - containerRect.top + scrollTop;
        const tgtBodyBottom =
          tgtBodyRect.bottom - containerRect.top + scrollTop;

        // Check visibility. If strictly outside, clamp.
        // Clamp Y to the visible body area.

        // Padding of ~2px to keep it inside the border
        const PAD = 2;

        // Clamp y1
        if (y1 < srcBodyTop)
          y1 = srcBodyTop + PAD; // +5 padding
        else if (y1 > srcBodyBottom) y1 = srcBodyBottom - PAD;

        // Clamp y2
        if (y2 < tgtBodyTop) y2 = tgtBodyTop + PAD;
        else if (y2 > tgtBodyBottom) y2 = tgtBodyBottom - PAD;

        // Control points for smooth S-curve
        const dist = Math.abs(x2 - x1);
        const controlOffset = Math.max(dist * 0.5, 60);

        const cp1x = x1 + controlOffset;
        const cp1y = y1;
        const cp2x = x2 - controlOffset;
        const cp2y = y2;

        const path = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

        newLines.push({
          id: join.id,
          path,
          x1,
          y1,
          x2,
          y2,
          join,
        });
      }
    }
    setLines(newLines);
  };

  // Animation Loop
  const animate = () => {
    calculateLines();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    // Start animation loop once
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current as number);
  }, []); // Empty dependency array = runs once, loop continues forever reading refs

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      {/* Defines for Markers */}
      <defs>
        <marker
          id="arrowhead-start"
          markerWidth="8"
          markerHeight="8"
          refX="0"
          refY="4"
          orient="auto"
        >
          <circle cx="4" cy="4" r="3" fill="#64748b" />
        </marker>
        <marker
          id="arrowhead-end"
          markerWidth="8"
          markerHeight="8"
          refX="8"
          refY="4"
          orient="auto"
        >
          <circle cx="4" cy="4" r="3" fill="#64748b" />
        </marker>
      </defs>

      {lines.map((line) => (
        <g key={line.id} className="group pointer-events-auto cursor-pointer">
          {/* Interaction Path (Thick, Invisible) */}
          <path
            d={line.path}
            fill="none"
            stroke="transparent"
            strokeWidth="20"
            onClick={(e) => {
              e.stopPropagation();
              // Select join logic
            }}
          />

          {/* Visible Line */}
          <path
            d={line.path}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            className="group-hover:stroke-blue-500 transition-colors"
            markerStart="url(#arrowhead-start)"
            markerEnd="url(#arrowhead-end)"
          />

          {/* Join Type Label */}
          <foreignObject
            x={(line.x1 + line.x2) / 2 - 15}
            y={(line.y1 + line.y2) / 2 - 15}
            width="30"
            height="30"
          >
            <div className="flex items-center justify-center w-full h-full">
              <div className="w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center shadow-sm text-[10px] font-bold text-slate-600 group-hover:border-blue-500 group-hover:text-blue-600 cursor-pointer relative">
                {line.join.join_type.substring(0, 1).toUpperCase()}

                {/* Delete Button (hover on label) */}
                <div
                  title="Delete Join"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Remove this join?")) {
                      removeJoin(line.join.id);
                    }
                  }}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  &times;
                </div>
              </div>
            </div>
          </foreignObject>
        </g>
      ))}
    </svg>
  );
}
