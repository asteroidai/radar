import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MultiFileDiff } from "@pierre/diffs/react";
import { ArrowLeft, Columns2, Rows2 } from "lucide-react";
import { VersionTimeline } from "./VersionTimeline";
import type { Id } from "../../../../convex/_generated/dataModel";

interface Props {
  fileId: Id<"files">;
  filePath: string;
  onBack: () => void;
}

export function VersionHistoryPanel({ fileId, filePath, onBack }: Props) {
  const contributions = useQuery(api.contributions.listByFile, { fileId });
  const [selectedNewId, setSelectedNewId] = useState<string | null>(null);
  const [selectedOldId, setSelectedOldId] = useState<string | null>(null);
  const [diffStyle, setDiffStyle] = useState<"unified" | "split">("unified");

  // Set defaults when contributions load
  useEffect(() => {
    if (!contributions || contributions.length === 0) return;
    if (selectedNewId) return;
    setSelectedNewId(contributions[0]!._id);
    setSelectedOldId(contributions[1]?._id ?? null);
  }, [contributions, selectedNewId]);

  if (!contributions) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        Loading history...
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>
        <div className="flex h-48 items-center justify-center text-sm text-zinc-400">
          No version history available
        </div>
      </div>
    );
  }

  if (contributions.length === 1) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>
        <div className="flex h-48 items-center justify-center text-sm text-zinc-400">
          Only one version exists — nothing to compare
        </div>
      </div>
    );
  }

  const newContribution = contributions.find((c) => c._id === selectedNewId);
  const oldContribution = contributions.find((c) => c._id === selectedOldId);

  const oldFile = {
    name: filePath,
    contents: oldContribution?.contentSnapshot ?? "",
  };
  const newFile = {
    name: filePath,
    contents: newContribution?.contentSnapshot ?? "",
  };

  function handleTimelineSelect(newId: string, oldId: string | null) {
    setSelectedNewId(newId);
    setSelectedOldId(oldId);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>

        <div className="flex items-center gap-3">
          {/* Version dropdowns */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>Comparing</span>
            <select
              value={selectedOldId ?? ""}
              onChange={(e) => setSelectedOldId(e.target.value || null)}
              className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700"
            >
              <option value="">empty</option>
              {contributions.map((c) => (
                <option key={c._id} value={c._id}>
                  v{c.newVersion}
                </option>
              ))}
            </select>
            <span>with</span>
            <select
              value={selectedNewId ?? ""}
              onChange={(e) => setSelectedNewId(e.target.value)}
              className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700"
            >
              {contributions.map((c) => (
                <option key={c._id} value={c._id}>
                  v{c.newVersion}
                </option>
              ))}
            </select>
          </div>

          {/* Split/Unified toggle */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
            <button
              onClick={() => setDiffStyle("unified")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                diffStyle === "unified"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Rows2 className="h-3 w-3" />
              Unified
            </button>
            <button
              onClick={() => setDiffStyle("split")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                diffStyle === "split"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Columns2 className="h-3 w-3" />
              Split
            </button>
          </div>
        </div>
      </div>

      {/* Body: Timeline + Diff */}
      <div className="flex gap-4">
        {/* Timeline sidebar */}
        <div className="w-56 shrink-0 overflow-y-auto">
          <VersionTimeline
            contributions={contributions}
            selectedOldId={selectedOldId}
            selectedNewId={selectedNewId}
            onSelect={handleTimelineSelect}
          />
        </div>

        {/* Diff view */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-zinc-200">
          <MultiFileDiff
            oldFile={oldFile}
            newFile={newFile}
            options={{
              diffStyle,
              theme: "pierre-light",
              disableFileHeader: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
