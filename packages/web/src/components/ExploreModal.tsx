import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
  const [starting, setStarting] = useState(false);
  const startExploration = useMutation(api.explorations.start);
  const navigate = useNavigate();

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
    setInstructions("");
    setStarting(false);
    onClose();
  }

  async function handleStart() {
    setStarting(true);
    try {
      const normalized = url.startsWith("http") ? url : `https://${url}`;
      await startExploration({
        url: normalized,
        instructions: instructions.trim() || undefined,
      });
      handleClose();
      navigate({ to: "/explore" });
    } catch {
      setStarting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-0 shadow-xl backdrop:bg-black/50"
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
          disabled={!url.trim() || starting}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting ? "Starting..." : "Start Exploration"}
        </button>
      </div>
    </dialog>
  );
}
