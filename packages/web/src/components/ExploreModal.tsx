import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { ScanProgress } from "./ScanProgress";
import { Compass, X } from "lucide-react";

export function ExploreModal({
  open,
  onClose,
  initialUrl,
}: {
  open: boolean;
  onClose: () => void;
  initialUrl: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [instructions, setInstructions] = useState("");
  const [explorationId, setExplorationId] = useState<Id<"explorations"> | null>(
    null,
  );
  const startExploration = useMutation(api.explorations.start);

  const exploration = useQuery(
    api.explorations.get,
    explorationId ? { id: explorationId } : "skip",
  );

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    setExplorationId(null);
    setInstructions("");
    onClose();
  }

  async function handleStart() {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const id = await startExploration({
      url: normalized,
      instructions: instructions.trim() || undefined,
    });
    setExplorationId(id);
  }

  const isStarted = explorationId !== null;
  const isDone =
    exploration?.status === "completed" || exploration?.status === "failed";

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-0 shadow-xl backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-zinc-900">
            Explore a site
          </h2>
        </div>
        <button
          onClick={handleClose}
          className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 px-6 py-5">
        {!isStarted ? (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Instructions{" "}
                <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Focus on the booking flow and find all available class types"
                rows={3}
                className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500"
              />
            </div>
            <button
              onClick={handleStart}
              disabled={!url.trim()}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Exploration
            </button>
          </>
        ) : exploration ? (
          <div className="space-y-4">
            <ScanProgress exploration={exploration} />
            {isDone && (
              <button
                onClick={handleClose}
                className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Close
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-600" />
          </div>
        )}
      </div>
    </dialog>
  );
}
