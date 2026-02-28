import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { NvimExplorer } from "@/components/NvimExplorer";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

function ExplorePage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#1e1e2e]">
      {/* Back button bar */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-[12px] text-[#a6adc8] transition-colors hover:bg-[#313244] hover:text-[#cdd6f4]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <NvimExplorer fullScreen />
      </div>
    </div>
  );
}
