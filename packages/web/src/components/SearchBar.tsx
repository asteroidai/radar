import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Search, Compass } from "lucide-react";
import { ExploreModal } from "./ExploreModal";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useQuery(
    api.sites.search,
    debouncedQuery ? { query: debouncedQuery } : "skip",
  );

  useEffect(() => {
    if (debouncedQuery && results) {
      setOpen(true);
    } else if (!debouncedQuery) {
      setOpen(false);
    }
  }, [debouncedQuery, results]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <div ref={ref} className="relative w-full max-w-xl">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors focus-within:border-emerald-500">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search sites, topics, or domains..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </div>
        {open && results && results.length > 0 && (
          <div className="absolute top-full left-0 z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
            {results.map((site) => (
              <button
                key={site._id}
                onClick={() => {
                  navigate({ to: "/sites/$domain", params: { domain: site.domain } });
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-zinc-50"
              >
                <span className="font-medium text-zinc-900">{site.name}</span>
                <span className="text-zinc-400">{site.domain}</span>
              </button>
            ))}
          </div>
        )}
        {open && debouncedQuery && results && results.length === 0 && (
          <div className="absolute top-full left-0 z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">No sites found</p>
              <button
                onClick={() => {
                  setExploreOpen(true);
                  setOpen(false);
                }}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <Compass className="h-3.5 w-3.5" />
                Explore this site
              </button>
            </div>
          </div>
        )}
      </div>
      <ExploreModal
        open={exploreOpen}
        onClose={() => setExploreOpen(false)}
        initialUrl={debouncedQuery}
      />
    </>
  );
}
