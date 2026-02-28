import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import type { Exploration } from "@/lib/mock-data";

const statusStyles: Record<
  Exploration["status"],
  { dot: string; label: string }
> = {
  queued: { dot: "bg-zinc-400", label: "Queued" },
  running: { dot: "bg-amber-500 animate-pulse", label: "Running" },
  completed: { dot: "bg-emerald-500", label: "Completed" },
  failed: { dot: "bg-red-500", label: "Failed" },
};

export function ScanProgress({ exploration }: { exploration: Exploration }) {
  const style = statusStyles[exploration.status];
  const { dot, label } = style;

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <div>
          <p className="font-medium text-zinc-900">{exploration.domain}</p>
          <p className="text-xs text-zinc-400">
            {label} &middot; Started{" "}
            {formatDistanceToNow(exploration.startedAt, { addSuffix: true })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm text-zinc-400">
        <FileText className="h-3.5 w-3.5" />
        {exploration.filesGenerated} files
      </div>
    </div>
  );
}
