import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { FileText, Folder } from "lucide-react";
import { MarkdownViewer } from "./MarkdownViewer";

export interface TreeNode {
  name: string;
  domain?: string;
  filePath?: string;
  children?: TreeNode[];
}

export function buildFileNodes(
  domain: string,
  files: { path: string }[],
): TreeNode[] {
  const dirs: Record<string, typeof files> = {};
  const rootFiles: typeof files = [];

  for (const f of files) {
    const slash = f.path.indexOf("/");
    if (slash === -1) {
      rootFiles.push(f);
    } else {
      const dir = f.path.slice(0, slash);
      (dirs[dir] ??= []).push(f);
    }
  }

  const children: TreeNode[] = [];
  for (const f of rootFiles) {
    children.push({ name: f.path, domain, filePath: f.path });
  }
  for (const [dir, dirFiles] of Object.entries(dirs)) {
    children.push({
      name: dir,
      children: dirFiles.map((f) => ({
        name: f.path.split("/").pop()!,
        domain,
        filePath: f.path,
      })),
    });
  }
  return children;
}

function buildMultiDomainTree(
  sites: { domain: string }[],
  allFiles: { domain: string; path: string }[],
): TreeNode[] {
  const filesByDomain: Record<string, typeof allFiles> = {};
  for (const f of allFiles) {
    (filesByDomain[f.domain] ??= []).push(f);
  }

  return sites.map((site) => ({
    name: site.domain,
    domain: site.domain,
    children: buildFileNodes(
      site.domain,
      filesByDomain[site.domain] ?? [],
    ),
  }));
}

interface Props {
  domain?: string;
  fullScreen?: boolean;
}

export function NvimExplorer({ domain, fullScreen = false }: Props) {
  // Multi-domain queries (skipped in single-domain mode)
  const sites = useQuery(api.sites.list, domain ? "skip" : undefined);
  const allFiles = useQuery(api.files.listAll, domain ? "skip" : undefined);

  // Single-domain query (skipped in multi-domain mode)
  const domainFiles = useQuery(
    api.files.listByDomain,
    domain ? { domain } : "skip",
  );

  const tree = domain
    ? buildFileNodes(domain, domainFiles ?? [])
    : sites && allFiles
      ? buildMultiDomainTree(sites, allFiles)
      : [];

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<{
    domain: string;
    path: string;
  } | null>(null);

  useEffect(() => {
    if (selectedFile) return;

    if (domain) {
      if (!domainFiles) return;
      // Auto-expand all directories in single-domain mode
      const dirNames = new Set<string>();
      for (const f of domainFiles) {
        const slash = f.path.indexOf("/");
        if (slash !== -1) dirNames.add(f.path.slice(0, slash));
      }
      setExpanded(dirNames);

      const readme =
        domainFiles.find((f) => f.path === "README.md") ?? domainFiles[0];
      if (readme) {
        setSelectedFile({ domain, path: readme.path });
      }
    } else {
      if (!sites || !allFiles || sites.length === 0) return;
      const firstDomain = sites[0]!.domain;
      setExpanded(new Set([firstDomain]));
      const filtered = allFiles.filter((f) => f.domain === firstDomain);
      const readme =
        filtered.find((f) => f.path === "README.md") ?? filtered[0];
      if (readme) {
        setSelectedFile({ domain: firstDomain, path: readme.path });
      }
    }
  }, [domain, sites, allFiles, domainFiles, selectedFile]);

  const currentFile = useQuery(
    api.files.getByDomainPath,
    selectedFile
      ? { domain: selectedFile.domain, path: selectedFile.path }
      : "skip",
  );

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderNode(node: TreeNode, depth: number, keyPrefix: string) {
    const key = `${keyPrefix}/${node.name}`;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.name) || expanded.has(key);
    const isFile = !!node.filePath;
    const isSelected =
      isFile &&
      selectedFile?.domain === node.domain &&
      selectedFile?.path === node.filePath;

    if (hasChildren && !isFile) {
      return (
        <div key={key}>
          <button
            onClick={() => toggle(depth === 0 ? node.name : key)}
            className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400 hover:text-zinc-600"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <span className="text-[10px]">{isExpanded ? "▾" : "▸"}</span>
            <Folder className="h-3 w-3" />
            {node.name}
          </button>
          {isExpanded && (
            <div>
              {node.children!.map((child) =>
                renderNode(child, depth + 1, key),
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={key}
        onClick={() => {
          if (node.filePath && node.domain) {
            setSelectedFile({ domain: node.domain, path: node.filePath });
          }
        }}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
          isSelected
            ? "bg-white text-zinc-900 font-medium shadow-sm"
            : "text-zinc-500 hover:bg-white/60 hover:text-zinc-900"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FileText className="h-3 w-3 shrink-0 text-zinc-400" />
        {node.name}
      </button>
    );
  }

  const sidebarLabel = domain ? "Files" : "Explore Knowledge";
  const height = fullScreen ? "100%" : "720px";

  return (
    <div
      className={`overflow-hidden rounded-xl border border-zinc-200 bg-white ${fullScreen ? "flex h-full flex-col" : ""}`}
    >
      <div
        className={`flex ${fullScreen ? "flex-1 overflow-hidden" : ""}`}
        style={{ height: fullScreen ? undefined : height }}
      >
        {/* File tree sidebar */}
        <div className="w-56 shrink-0 overflow-y-auto border-r border-zinc-100 bg-zinc-50/50 p-3">
          <div className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            {sidebarLabel}
          </div>
          <div className="space-y-0.5">
            {tree.map((node) => renderNode(node, 0, ""))}
          </div>
        </div>

        {/* Content area */}
        <div className="min-w-0 flex-1 overflow-auto p-6">
          <MarkdownViewer file={currentFile ?? null} />
        </div>
      </div>
    </div>
  );
}
