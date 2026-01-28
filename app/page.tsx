import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}

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
  {
    id: 335984,
    season: "2007/08",
    city: "Delhi",
    date: "19-04-2008",
    match_type: "League",
    player_of_match: "MF Maharoofs",
    venue: "Feroz Shah Kotla",
    team1: "Delhi Daredevils",
    team2: "Rajasthan Royals",
    toss_winner: "Rajasthan Royals",
    toss_decision: "bat",
    winner: "Delhi Daredevils",
    result: "wickets",
    result_margin: 9,
    target: 130,
  },
  {
    id: 335985,
    season: "2007/08",
    city: "Mumbai",
    date: "20-04-2008",
    match_type: "League",
    player_of_match: "MV Boucher",
    venue: "Wankhede Stadium",
    team1: "Mumbai Indians",
    team2: "Royal Challengers Bangalore",
    toss_winner: "Mumbai Indians",
    toss_decision: "bat",
    winner: "Royal Challengers Bangalore",
    result: "wickets",
    result_margin: 5,
    target: 166,
  },
  {
    id: 335986,
    season: "2007/08",
    city: "Kolkata",
    date: "20-04-2008",
    match_type: "League",
    player_of_match: "DJ Hussey",
    venue: "Eden Gardens",
    team1: "Kolkata Knight Riders",
    team2: "Deccan Chargers",
    toss_winner: "Deccan Chargers",
    toss_decision: "bat",
    winner: "Kolkata Knight Riders",
    result: "wickets",
    result_margin: 5,
    target: 111,
  },
  {
    id: 335987,
    season: "2007/08",
    city: "Jaipur",
    date: "21-04-2008",
    match_type: "League",
    player_of_match: "SR Watson",
    venue: "Sawai Mansingh Stadium",
    team1: "Rajasthan Royals",
    team2: "Kings XI Punjab",
    toss_winner: "Kings XI Punjab",
    toss_decision: "bat",
    winner: "Rajasthan Royals",
    result: "wickets",
    result_margin: 6,
    target: 167,
  },
  {
    id: 335988,
    season: "2007/08",
    city: "Hyderabad",
    date: "22-04-2008",
    match_type: "League",
    player_of_match: "V Sehwag",
    venue: "Rajiv Gandhi International Stadium, Uppal",
    team1: "Deccan Chargers",
    team2: "Delhi Daredevils",
    toss_winner: "Deccan Chargers",
    toss_decision: "bat",
    winner: "Delhi Daredevils",
    result: "wickets",
    result_margin: 9,
    target: 143,
  },
  {
    id: 335989,
    season: "2007/08",
    city: "Chennai",
    date: "23-04-2008",
    match_type: "League",
    player_of_match: "ML Hayden",
    venue: "MA Chidambaram Stadium, Chepauk",
    team1: "Chennai Super Kings",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Chennai Super Kings",
    result: "runs",
    result_margin: 6,
    target: 209,
  },
  {
    id: 335990,
    season: "2007/08",
    city: "Hyderabad",
    date: "24-04-2008",
    match_type: "League",
    player_of_match: "YK Pathan",
    venue: "Rajiv Gandhi International Stadium, Uppal",
    team1: "Deccan Chargers",
    team2: "Rajasthan Royals",
    toss_winner: "Rajasthan Royals",
    toss_decision: "field",
    winner: "Rajasthan Royals",
    result: "wickets",
    result_margin: 3,
    target: 215,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
  {
    id: 335991,
    season: "2007/08",
    city: "Chandigarh",
    date: "25-04-2008",
    match_type: "League",
    player_of_match: "KC Sangakkara",
    venue: "Punjab Cricket Association Stadium, Mohali",
    team1: "Kings XI Punjab",
    team2: "Mumbai Indians",
    toss_winner: "Mumbai Indians",
    toss_decision: "field",
    winner: "Kings XI Punjab",
    result: "runs",
    result_margin: 66,
    target: 183,
  },
];

// export default function Home() {
//   return (
//     <main className="p-6">
//       <div className="mb-4 flex items-center justify-between">
//         <h1 className="text-xl font-semibold">ipl_matches_data_10</h1>
//         <div className="text-sm text-muted-foreground">Showing 10 rows</div>
//       </div>

//       <div className="mb-4">
//         {/* Placeholder for "Table view" dropdown or title if needed */}
//         <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-[180px] justify-between">
//           <span>Table view</span>
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             className="h-4 w-4 opacity-50"
//           >
//             <path d="m6 9 6 6 6-6" />
//           </svg>
//         </div>
//       </div>

//       <AdvancedDataTable columns={columns} data={data} />
//     </main>
//   );
// }
