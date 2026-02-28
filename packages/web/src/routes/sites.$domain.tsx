import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Globe } from "lucide-react";
import { getSiteByDomain, getFilesBySite, getFile } from "@/lib/mock-data";
import { FileTree } from "@/components/FileTree";
import { MarkdownViewer } from "@/components/MarkdownViewer";

export const Route = createFileRoute("/sites/$domain")({
  component: SiteDetailPage,
});

function SiteDetailPage() {
  const { domain } = Route.useParams();
  const site = getSiteByDomain(domain);
  const files = getFilesBySite(domain);
  const [selectedPath, setSelectedPath] = useState<string>(
    files.find((f) => f.path === "README.md")?.path ?? files[0]?.path ?? "",
  );

  const currentFile = getFile(domain, selectedPath) ?? null;

  if (!site) {
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
    <div className="space-y-6">
      <div>
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <div className="flex items-start gap-3">
          <Globe className="mt-1 h-5 w-5 text-zinc-400" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{site.name}</h1>
            <p className="mt-0.5 text-sm text-zinc-400">{site.domain}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              {site.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {site.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-60 shrink-0 rounded-lg border border-zinc-200 bg-white p-3">
          <FileTree
            files={files}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
          />
        </div>
        <div className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white p-6">
          <MarkdownViewer file={currentFile} />
        </div>
      </div>
    </div>
  );
}
