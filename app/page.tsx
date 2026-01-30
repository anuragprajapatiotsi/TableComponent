"use client";

import {
  AdvancedDataTable,
  ColumnConfig,
} from "@/components/ui/advanced-data-table";

type Match = {
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

const columns: ColumnConfig<Match>[] = [
  { key: "id", label: "ID", type: "number" },
  { key: "season", label: "Season", type: "string" },
  { key: "city", label: "City", type: "string" },
  { key: "date", label: "Date", type: "string" },
  { key: "match_type", label: "Match Type", type: "string" },
  { key: "player_of_match", label: "Player of Match", type: "string" },
  { key: "venue", label: "Venue", type: "string" },
  { key: "team1", label: "Team 1", type: "string" },
  { key: "team2", label: "Team 2", type: "string" },
  { key: "toss_winner", label: "Toss Winner", type: "string" },
  { key: "toss_decision", label: "Toss Decision", type: "string" },
  { key: "winner", label: "Winner", type: "string" },
  { key: "result", label: "Result", type: "string" },
  { key: "result_margin", label: "Result Margin", type: "number" },
  { key: "target", label: "Target", type: "number" },
];

const data: Match[] = [
  {
    id: 335982,
    season: "2007/08",
    city: "Bangalore",
    date: "18-04-2008",
    match_type: "League",
    player_of_match: "BB McCullum",
    venue: "M Chinnaswamy Stadium",
    team1: "Royal Challengers Bangalore",
    team2: "Kolkata Knight Riders",
    toss_winner: "Royal Challengers Bangalore",
    toss_decision: "field",
    winner: "Kolkata Knight Riders",
    result: "runs",
    result_margin: 140,
    target: 223,
  },
  {
    id: 335983,
    season: "2007/08",
    city: "Chandigarh",
    date: "19-04-2008",
    match_type: "League",
    player_of_match: "MEK Hussey",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Chennai Super Kings",
    toss_winner: "Chennai Super Kings",
    toss_decision: "bat",
    winner: "Chennai Super Kings",
    result: "runs",
    result_margin: 33,
    target: 241,
  },
  // add more unique rows if needed
];

export default function Home() {
  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">ipl_matches_data_10</h1>
        <div className="text-sm text-muted-foreground">
          Showing {data.length} rows
        </div>
      </div>

      <AdvancedDataTable columns={columns} data={data} />
    </main>
  );
}
