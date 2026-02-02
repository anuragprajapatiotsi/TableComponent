"use client";

import { AdvancedDataTable } from "@/components/ui/advanced-data-table";

export default function Home() {
  return (
    <main className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">ipl_matches_data_10</h1>
      </div>

      <AdvancedDataTable
        endpoint="http://localhost:8000/table"
        params={{ table: "ipl_matches" }}
      />
    </main>
  );
}
