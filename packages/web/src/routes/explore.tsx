import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import {
  Compass,
  Plus,
  FileText,
  ExternalLink,
  Play,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { ExploreModal } from "@/components/ExploreModal";
import type { Doc } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

type Exploration = Doc<"explorations">;

const statusConfig: Record<
  Exploration["status"],
  { dot: string; label: string; bg: string }
> = {
  queued: { dot: "bg-zinc-400", label: "Queued", bg: "bg-zinc-50 text-zinc-600" },
  running: { dot: "bg-amber-500 animate-pulse", label: "Running", bg: "bg-amber-50 text-amber-700" },
  completed: { dot: "bg-emerald-500", label: "Completed", bg: "bg-emerald-50 text-emerald-700" },
  failed: { dot: "bg-red-500", label: "Failed", bg: "bg-red-50 text-red-700" },
};

function LivePreview({
  liveUrl,
  expanded,
  onToggle,
}: {
  liveUrl: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (expanded) {
    return (
      <div className="relative overflow-hidden rounded-md border border-zinc-200 bg-zinc-900">
        <iframe
          src={liveUrl}
          sandbox="allow-same-origin allow-scripts"
          allow="clipboard-read; clipboard-write"
          className="h-96 w-full"
          style={{ pointerEvents: "none" }}
        />
        <button
          onClick={onToggle}
          className="absolute right-1.5 bottom-1.5 rounded bg-black/60 p-1 text-white/70 transition-colors hover:text-white"
        >
          <Minimize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative h-20 w-36 cursor-pointer overflow-hidden rounded-md border border-zinc-200 bg-zinc-900"
      onClick={onToggle}
    >
      <iframe
        src={liveUrl}
        sandbox="allow-same-origin allow-scripts"
        allow="clipboard-read; clipboard-write"
        className="h-[400%] w-[400%] origin-top-left scale-25"
        style={{ pointerEvents: "none" }}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity hover:bg-black/30 hover:opacity-100">
        <Maximize2 className="h-4 w-4 text-white" />
      </div>
    </div>
  );
}

function ReplayLink({ sessionId }: { sessionId: string }) {
  const url = `https://cloud.browser-use.com/experimental/session/${sessionId}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
    >
      <Play className="h-3 w-3 text-emerald-500" />
      View replay
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function ExplorationCard({ exploration }: { exploration: Exploration }) {
  const config = statusConfig[exploration.status];
  const [expanded, setExpanded] = useState(false);
  const liveFileCount = useQuery(api.files.countByDomain, {
    domain: exploration.domain,
  });

  const isRunning = exploration.status === "running";
  const isDone =
    exploration.status === "completed" || exploration.status === "failed";

  const showLive = isRunning && !!exploration.liveUrl;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="truncate font-medium text-zinc-900">
              {exploration.domain}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
              {config.label}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-zinc-400">
            {exploration.url}
          </p>
          {exploration.instructions && (
            <p className="mt-1.5 line-clamp-1 text-xs text-zinc-400 italic">
              {exploration.instructions}
            </p>
          )}
        </div>

        {/* Thumbnail preview (small, right-aligned) or replay link */}
        <div className="flex shrink-0 items-center">
          {showLive && !expanded && (
            <LivePreview
              liveUrl={exploration.liveUrl!}
              expanded={false}
              onToggle={() => setExpanded(true)}
            />
          )}
          {isDone && exploration.sessionId && (
            <ReplayLink sessionId={exploration.sessionId} />
          )}
        </div>
      </div>

      {/* Expanded preview (full width, below the header) */}
      {showLive && expanded && (
        <div className="mt-3">
          <LivePreview
            liveUrl={exploration.liveUrl!}
            expanded={true}
            onToggle={() => setExpanded(false)}
          />
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
        <span>
          Started{" "}
          {formatDistanceToNow(exploration.startedAt, { addSuffix: true })}
        </span>
        {exploration.completedAt && (
          <span>
            Finished{" "}
            {formatDistanceToNow(exploration.completedAt, { addSuffix: true })}
          </span>
        )}
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {liveFileCount ?? 0} files
        </span>
      </div>

      {exploration.resultSummary && (
        <p className="mt-2 text-xs text-zinc-500">{exploration.resultSummary}</p>
      )}
    </div>
  );
}

function ExplorePage() {
  const explorations = useQuery(api.explorations.list, {});
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Explorations
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Track Browser Use agents exploring the web
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New Exploration
          </button>
        </div>

        {explorations === undefined ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-lg bg-zinc-100"
              />
            ))}
          </div>
        ) : explorations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 py-16">
            <Compass className="h-10 w-10 text-zinc-300" />
            <p className="mt-3 text-sm text-zinc-400">
              No explorations yet. Start one to discover new sites.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              New Exploration
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {explorations.map((exploration) => (
              <ExplorationCard
                key={exploration._id}
                exploration={exploration}
              />
            ))}
          </div>
        )}
      </div>

      <ExploreModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialUrl=""
      />
    </>
  );
}
