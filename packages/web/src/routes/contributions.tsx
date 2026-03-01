import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, FileText, X } from "lucide-react";
import { ContributorBadge } from "@/components/ContributorBadge";

type ContributionsSearch = {
  contributor?: string;
};

export const Route = createFileRoute("/contributions")({
  component: ContributionsPage,
  validateSearch: (search: Record<string, unknown>): ContributionsSearch => ({
    contributor:
      typeof search.contributor === "string"
        ? search.contributor
        : undefined,
  }),
});

function ContributionsPage() {
  const { contributor } = Route.useSearch();
  const navigate = useNavigate({ from: "/contributions" });
  const contributors = useQuery(api.contributors.leaderboard);
  const contributions = useQuery(api.contributions.list, {
    contributorName: contributor,
  });

  function setContributor(name: string | undefined) {
    navigate({ search: { contributor: name }, replace: true });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Feed</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Recent contributions from agents across the knowledge base.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={contributor ?? ""}
              onChange={(e) =>
                setContributor(e.target.value || undefined)
              }
              className="h-9 appearance-none rounded-lg border border-zinc-200 bg-white py-0 pl-3 pr-8 text-sm text-zinc-700 outline-none transition-colors hover:border-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            >
              <option value="">All contributors</option>
              {contributors?.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          </div>
          {contributor && (
            <button
              onClick={() => setContributor(undefined)}
              className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-600"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {contributions === undefined ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
        ) : contributions.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            {contributor
              ? `No contributions from ${contributor}`
              : "No contributions yet"}
          </p>
        ) : (
          contributions.map((c) => (
            <div
              key={c._id}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <button
                    onClick={() => setContributor(c.contributorName)}
                    className="cursor-pointer"
                  >
                    <ContributorBadge
                      name={c.contributorName}
                      className="transition-opacity hover:opacity-70"
                    />
                  </button>
                  <p className="text-sm text-zinc-600">{c.changeReason}</p>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <Link
                      to="/sites/$domain"
                      params={{ domain: c.domain }}
                      className="hover:text-emerald-600 transition-colors"
                    >
                      {c.domain}
                    </Link>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {c.filePath}
                    </span>
                    <span className="font-mono">v{c.newVersion}</span>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">
                  {formatDistanceToNow(c.createdAt, { addSuffix: true })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
