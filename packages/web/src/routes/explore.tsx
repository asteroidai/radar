import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { NvimExplorer } from "@/components/NvimExplorer";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

function ExplorePage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-50">
      <div className="flex items-center gap-2 px-4 py-2">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>
      <div className="flex-1 overflow-hidden px-4 pb-4">
        <NvimExplorer fullScreen />
      </div>
    </div>
  );
}
