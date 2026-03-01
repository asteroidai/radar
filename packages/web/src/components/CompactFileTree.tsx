import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { FileText, Folder, ChevronRight, ChevronDown } from "lucide-react";
import { buildFileNodes, type TreeNode } from "./NvimExplorer";
import { Link } from "@tanstack/react-router";

interface CompactFileTreeProps {
  domain: string;
  maxHeight?: string;
}

export function CompactFileTree({ domain, maxHeight = "10rem" }: CompactFileTreeProps) {
  const files = useQuery(api.files.listByDomain, { domain });
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  if (!files || files.length === 0) return null;

  const tree = buildFileNodes(domain, files);

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
    const isFile = !!node.filePath;
    const isExpanded = expanded.has(key);

    if (hasChildren && !isFile) {
      return (
        <div key={key}>
          <button
            onClick={() => toggle(key)}
            className="flex w-full items-center gap-1 py-0.5 text-left text-[11px] text-zinc-500 hover:text-zinc-700"
            style={{ paddingLeft: `${depth * 10}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="size-3 shrink-0" />
            ) : (
              <ChevronRight className="size-3 shrink-0" />
            )}
            <Folder className="size-3 shrink-0 text-zinc-400" />
            <span className="truncate">{node.name}</span>
          </button>
          {isExpanded && (
            <div>
              {node.children!.map((child) => renderNode(child, depth + 1, key))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={key}
        to="/sites/$domain"
        params={{ domain }}
        className="flex w-full items-center gap-1 py-0.5 text-left text-[11px] text-zinc-500 hover:text-zinc-700"
        style={{ paddingLeft: `${depth * 10 + 16}px` }}
      >
        <FileText className="size-3 shrink-0 text-zinc-400" />
        <span className="truncate">{node.name}</span>
      </Link>
    );
  }

  return (
    <div
      className="overflow-y-auto rounded-md border border-zinc-100 bg-zinc-50/50 px-2 py-1.5"
      style={{ maxHeight }}
    >
      {tree.map((node) => renderNode(node, 0, ""))}
    </div>
  );
}
