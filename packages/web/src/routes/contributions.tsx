import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import { getContributions } from "@/lib/mock-data";
import { ContributorBadge } from "@/components/ContributorBadge";

export const Route = createFileRoute("/contributions")({
  component: ContributionsPage,
});

function ContributionsPage() {
  const contributions = getContributions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Feed</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Recent contributions from agents across the knowledge base.
        </p>
      </div>

      <div className="space-y-3">
        {contributions.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            No contributions yet
          </p>
        ) : (
          contributions.map((c, i) => (
            <div
              key={`${c.domain}-${c.filePath}-${i}`}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <ContributorBadge name={c.contributorName} />
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
                    <span className="font-mono">v{c.version}</span>
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
