import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { getExplorations } from "@/lib/mock-data";
import { ScanProgress } from "@/components/ScanProgress";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

function ExplorePage() {
  const [url, setUrl] = useState("");
  const explorations = getExplorations();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Explore</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Send an agent to explore a website and generate knowledge files.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Enter a URL to explore..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500"
        />
        <button
          disabled
          className="flex items-center gap-2 rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-400 cursor-not-allowed"
        >
          <Compass className="h-4 w-4" />
          Explore
        </button>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
          Recent Explorations
        </h2>
        {explorations.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            No explorations yet
          </p>
        ) : (
          <div className="space-y-3">
            {explorations.map((e) => (
              <ScanProgress key={e.domain} exploration={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
