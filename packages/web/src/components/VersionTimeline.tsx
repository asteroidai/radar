import { formatDistanceToNow } from "date-fns";
import { ContributorBadge } from "./ContributorBadge";
import { GitBranch } from "lucide-react";

interface Contribution {
  _id: string;
  contributorName: string;
  changeReason: string;
  newVersion: number;
  createdAt: number;
}

interface Props {
  contributions: Contribution[];
  selectedOldId: string | null;
  selectedNewId: string | null;
  onSelect: (newId: string, oldId: string | null) => void;
}

export function VersionTimeline({
  contributions,
  selectedOldId,
  selectedNewId,
  onSelect,
}: Props) {
  return (
    <div className="space-y-1">
      {contributions.map((c, i) => {
        const isNew = c._id === selectedNewId;
        const isOld = c._id === selectedOldId;
        const prevContribution = contributions[i + 1] ?? null;

        return (
          <button
            key={c._id}
            onClick={() => onSelect(c._id, prevContribution?._id ?? null)}
            className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
              isNew
                ? "border-emerald-300 bg-emerald-50"
                : isOld
                  ? "border-blue-300 bg-blue-50"
                  : "border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
                <GitBranch className="h-2.5 w-2.5" />
                v{c.newVersion}
              </span>
              {isNew && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  B
                </span>
              )}
              {isOld && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                  A
                </span>
              )}
            </div>
            <div className="mt-1.5">
              <ContributorBadge name={c.contributorName} className="text-xs" />
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-zinc-500">
              {c.changeReason}
            </p>
            <p className="mt-1 text-[10px] text-zinc-400">
              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
            </p>
          </button>
        );
      })}
    </div>
  );
}
