"use client";

import AddURL from "@/components/add-url";

export default function Home() {

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Web Crawler Dashboard</h1>
        <p className="text-muted-foregrond">
          Analyze websites and track their key metrics including HTML structure, links, and accessibility.
        </p>
      </div>

      <AddURL />
    </div>
  );
}
