"use client";

import AddURL from "@/components/add-url";
import UrlsTable from "@/components/urls-table";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Home() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold">Web Crawler Dashboard</h1>
          <p className="text-muted-foregrond">
            Analyze websites and track their key metrics including HTML structure, links, and accessibility.
          </p>
        </div>

        <AddURL />

        <UrlsTable />
      </div>
    </QueryClientProvider>
  );
}
