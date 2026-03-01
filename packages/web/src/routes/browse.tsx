import { createFileRoute, Link } from "@tanstack/react-router";
import { NvimExplorer } from "@/components/NvimExplorer";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/browse")({
  component: BrowsePage,
});

function BrowsePage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-sm font-semibold text-zinc-900">Browse</h1>
      </div>
      <NvimExplorer />
    </div>
  );
}
