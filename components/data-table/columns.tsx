"use client";

import { Column, ColumnDef } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Match = {
  id: number;
  season: string;
  city: string;
  date: string;
  match_type: string;
  player_of_match: string;
  venue: string;
  team1: string;
  team2: string;
  toss_winner: string;
  toss_decision: string;
  winner: string;
  result: string;
  result_margin: number;
  target: number;
};

// Helper to render header with type indicator and sorting menu
const HeaderWithType = ({
  column,
  type,
  text,
}: {
  column: Column<Match, unknown>;
  type: "number" | "string";
  text: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="group flex items-center w-full gap-1.5">
      {/* Left content */}
      <span className="text-[10px] uppercase text-muted-foreground/70 font-mono tracking-tighter">
        {type === "number" ? "123" : "ABC"}
      </span>

      <span className="font-medium text-muted-foreground truncate">{text}</span>

      {/* Right menu */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="
              h-6 w-6 p-0 ml-auto
              opacity-0
              group-hover:opacity-100
              transition-opacity
            "
          >
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side="bottom"
          className="w-40"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <DropdownMenuItem
            onClick={() => column.toggleSorting(false)}
            className={column.getIsSorted() === "asc" ? "bg-accent" : ""}
          >
            Sort Ascending
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => column.toggleSorting(true)}
            className={column.getIsSorted() === "desc" ? "bg-accent" : ""}
          >
            Sort Descending
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const columns: ColumnDef<Match>[] = [
  {
    id: "index",
    header: () => (
      <div className="flex items-center justify-center h-full w-full">
        <span className="font-medium text-muted-foreground">#</span>
      </div>
    ),
    cell: ({ row }) => <>{row.index + 1}</>,
    enableSorting: false,
    size: 50,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <HeaderWithType column={column} type="number" text="ID" />
    ),
  },
  {
    accessorKey: "season",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="Season" />
    ),
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="City" />
    ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="Date" />
    ),
  },
  {
    accessorKey: "match_type",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="Match Type" />
    ),
  },
  {
    accessorKey: "player_of_match",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="Player of Match" />
    ),
  },
  {
    accessorKey: "venue",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="Venue" />
    ),
  },
  {
    accessorKey: "team1",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="Team 1" />
    ),
  },
  {
    accessorKey: "team2",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="Team 2" />
    ),
  },
  {
    accessorKey: "toss_winner",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="Toss Winner" />
    ),
  },
  {
    accessorKey: "toss_decision",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="Toss Decision" />
    ),
  },
  {
    accessorKey: "winner",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="Winner" />
    ),
  },
  {
    accessorKey: "result",
    header: ({ column }) => (
      <HeaderWithType column={column} type="string" text="Result" />
    ),
  },
  {
    accessorKey: "result_margin",
    header: ({ column }) => (
      <HeaderWithType column={column} type="number" text="Result Margin" />
    ),
  },
  {
    accessorKey: "target",
    header: ({ column }) => (
      <HeaderWithType column={column} type="number" text="Target" />
    ),
  },
];
