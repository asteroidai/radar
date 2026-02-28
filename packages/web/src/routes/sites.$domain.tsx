import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, Globe, FileText } from "lucide-react";
import { FileTree } from "@/components/FileTree";
import { MarkdownViewer } from "@/components/MarkdownViewer";

export const Route = createFileRoute("/sites/$domain")({
  component: SiteDetailPage,
});

function SiteDetailPage() {
  const { domain } = Route.useParams();
  const site = useQuery(api.sites.getByDomain, { domain });
  const files = useQuery(api.files.listByDomain, { domain });
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Set default selected path once files load
  const activePath =
    selectedPath ??
    files?.find((f) => f.path === "README.md")?.path ??
    files?.[0]?.path ??
    null;

  const currentFile = useQuery(
    api.files.getByDomainPath,
    activePath ? { domain, path: activePath } : "skip",
  );

  if (site === undefined || files === undefined) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-64 animate-pulse rounded bg-zinc-100" />
        <div className="h-[600px] animate-pulse rounded-xl bg-zinc-100" />
      </div>
    );
  }

  if (site === null) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-zinc-500">Site not found</p>
        <Link to="/" className="text-sm text-emerald-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Compact header */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
            <Globe className="h-4 w-4 text-zinc-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-zinc-900">
                {site.name}
              </h1>
              <span className="text-xs text-zinc-400">{site.domain}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {site.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-zinc-400">
          <FileText className="h-3 w-3" />
          {files.length} files
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-0 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {/* File tree sidebar */}
        <div className="w-56 shrink-0 border-r border-zinc-100 bg-zinc-50/50 p-3">
          <div className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Files
          </div>
          <FileTree
            files={files}
            selectedPath={activePath}
            onSelect={setSelectedPath}
          />
        </div>

        {/* Content area */}
        <div className="min-w-0 flex-1 p-6">
          <MarkdownViewer file={currentFile ?? null} />
        </div>
      </div>
    </div>
  );
}
