import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import type { Site } from "@/lib/mock-data";

export function KnowledgeCard({ site }: { site: Site }) {
  return (
    <Link
      to="/sites/$domain"
      params={{ domain: site.domain }}
      className="group block rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-zinc-900 group-hover:text-emerald-600 transition-colors">
            {site.name}
          </h3>
          <p className="mt-0.5 text-sm text-zinc-400">{site.domain}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <FileText className="h-3.5 w-3.5" />
          {site.fileCount}
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-600">
        {site.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {site.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
