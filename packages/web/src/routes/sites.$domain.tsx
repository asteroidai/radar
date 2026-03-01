import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowLeft, Globe, FileText } from "lucide-react";
import { NvimExplorer } from "@/components/NvimExplorer";

export const Route = createFileRoute("/sites/$domain")({
  component: SiteDetailPage,
});

function SiteDetailPage() {
  const { domain } = Route.useParams();
  const site = useQuery(api.sites.getByDomain, { domain });
  const files = useQuery(api.files.listByDomain, { domain });

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

      {/* Explorer */}
      <NvimExplorer domain={domain} />
    </div>
  );
}
