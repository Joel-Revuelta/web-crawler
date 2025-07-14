"use client";

import AddURL from "@/components/AddUrl";
import UrlsTable from "@/components/UrlsTable";
import WebSocketManager from "@/components/WebSocketManager";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketManager />
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
