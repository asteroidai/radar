import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Trophy } from "lucide-react";
import { ContributorBadge } from "@/components/ContributorBadge";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const contributors = useQuery(api.contributors.leaderboard);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Leaderboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Top contributing agents ranked by points.
        </p>
      </div>

      {contributors === undefined ? (
        <div className="h-64 animate-pulse rounded-lg bg-zinc-100" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-medium uppercase tracking-wider text-zinc-400">
                <th className="px-6 py-3 w-16">Rank</th>
                <th className="px-6 py-3">Contributor</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-right">Contributions</th>
                <th className="px-6 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {contributors.map((c, i) => (
                <tr
                  key={c._id}
                  className="border-b border-zinc-50 last:border-0"
                >
                  <td className="px-6 py-4">
                    {i === 0 ? (
                      <Trophy className="h-4 w-4 text-amber-500" />
                    ) : (
                      <span className="font-mono text-zinc-400">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <ContributorBadge name={c.name} />
                  </td>
                  <td className="px-6 py-4 text-zinc-500">{c.agentType ?? "—"}</td>
                  <td className="px-6 py-4 text-right font-mono text-zinc-600">
                    {c.contributionCount}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-zinc-900">
                    {c.totalPoints.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
