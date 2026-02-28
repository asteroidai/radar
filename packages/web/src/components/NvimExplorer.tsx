import { useState } from "react";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import {
  getSites,
  getFilesBySite,
  getFile,
  type Site,
  type KnowledgeFile,
} from "@/lib/mock-data";

// Catppuccin Mocha palette
const C = {
  base: "#1e1e2e",
  mantle: "#181825",
  crust: "#11111b",
  surface0: "#313244",
  surface1: "#45475a",
  surface2: "#585b70",
  overlay0: "#6c7086",
  text: "#cdd6f4",
  subtext0: "#a6adc8",
  subtext1: "#bac2de",
  green: "#a6e3a1",
  blue: "#89b4fa",
  yellow: "#f9e2af",
  lavender: "#b4befe",
  peach: "#fab387",
  mauve: "#cba6f7",
  red: "#f38ba8",
  teal: "#94e2d5",
};

interface TreeNode {
  name: string;
  domain?: string;
  file?: KnowledgeFile;
  children?: TreeNode[];
  expanded?: boolean;
}

function buildTree(sites: Site[]): TreeNode[] {
  return sites.map((site) => {
    const files = getFilesBySite(site.domain);
    const dirs: Record<string, KnowledgeFile[]> = {};
    const rootFiles: KnowledgeFile[] = [];

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
      children.push({ name: f.path, domain: site.domain, file: f });
    }
    for (const [dir, dirFiles] of Object.entries(dirs)) {
      children.push({
        name: dir,
        children: dirFiles.map((f) => ({
          name: f.path.split("/").pop()!,
          domain: site.domain,
          file: f,
        })),
      });
    }

    return {
      name: site.domain,
      domain: site.domain,
      children,
    };
  });
}

export function NvimExplorer({ fullScreen = false }: { fullScreen?: boolean }) {
  const sites = getSites();
  const tree = buildTree(sites);

  const [expanded, setExpanded] = useState<Set<string>>(
    new Set([sites[0]?.domain ?? ""]),
  );
  const [selectedFile, setSelectedFile] = useState<{
    domain: string;
    path: string;
  } | null>(() => {
    const first = sites[0];
    if (!first) return null;
    const files = getFilesBySite(first.domain);
    const readme = files.find((f) => f.path === "README.md") ?? files[0];
    return readme ? { domain: first.domain, path: readme.path } : null;
  });

  const currentFile = selectedFile
    ? (getFile(selectedFile.domain, selectedFile.path) ?? null)
    : null;

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
    const isFile = !!node.file;
    const isSelected =
      isFile &&
      selectedFile?.domain === node.domain &&
      selectedFile?.path === node.file?.path;

    return (
      <div key={key}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggle(depth === 0 ? node.name : key);
            } else if (node.file && node.domain) {
              setSelectedFile({ domain: node.domain, path: node.file.path });
            }
          }}
          className="flex w-full items-center gap-0 text-left text-[13px] leading-[22px] transition-colors"
          style={{
            paddingLeft: `${depth * 16 + 12}px`,
            paddingRight: "12px",
            color: isSelected
              ? C.text
              : isFile
                ? C.subtext0
                : depth === 0
                  ? C.blue
                  : C.yellow,
            backgroundColor: isSelected ? C.surface0 : "transparent",
          }}
          onMouseEnter={(e) => {
            if (!isSelected)
              e.currentTarget.style.backgroundColor = C.surface0 + "60";
          }}
          onMouseLeave={(e) => {
            if (!isSelected)
              e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {hasChildren ? (
            <span
              style={{ color: C.overlay0, width: "16px", display: "inline-block", textAlign: "center" }}
            >
              {isExpanded ? "▾" : "▸"}
            </span>
          ) : (
            <span style={{ width: "16px", display: "inline-block" }} />
          )}
          <span>
            {hasChildren && !isFile ? (
              <>
                {depth === 0 ? "󰉋 " : "󰉖 "}
                {node.name}
                {depth === 0 && (
                  <span style={{ color: C.overlay0 }}>/</span>
                )}
              </>
            ) : (
              <>
                <span style={{ color: C.green }}>󰈙 </span>
                {node.name}
              </>
            )}
          </span>
        </button>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) =>
              renderNode(child, depth + 1, key),
            )}
          </div>
        )}
      </div>
    );
  }

  const lineCount = currentFile
    ? currentFile.content.split("\n").length
    : 0;

  return (
    <div
      className={fullScreen ? "flex h-full flex-col overflow-hidden" : "overflow-hidden rounded-xl shadow-2xl"}
      style={{
        ...(!fullScreen && { border: `1px solid ${C.surface0}` }),
        fontFamily:
          "'JetBrains Mono', 'SF Mono', 'Cascadia Code', ui-monospace, monospace",
      }}
    >
      {/* Title bar — hidden in full-screen (explore page has its own back button) */}
      {!fullScreen && <div
        className="flex items-center justify-between px-4 py-2"
        style={{ backgroundColor: C.crust, borderBottom: `1px solid ${C.surface0}` }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: C.red }}
            />
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: C.yellow }}
            />
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: C.green }}
            />
          </div>
          <span className="ml-2 text-xs" style={{ color: C.overlay0 }}>
            nvim — radar
          </span>
        </div>
        {currentFile && (
          <span className="text-xs" style={{ color: C.overlay0 }}>
            {currentFile.domain}/{currentFile.path}
          </span>
        )}
      </div>}

      {/* Main content */}
      <div className={fullScreen ? "flex flex-1 overflow-hidden" : "flex"} style={{ backgroundColor: C.base, ...(!fullScreen && { height: "720px" }) }}>
        {/* File tree (NERDTree style) */}
        <div
          className="shrink-0 overflow-y-auto"
          style={{
            width: "280px",
            backgroundColor: C.mantle,
            borderRight: `1px solid ${C.surface0}`,
          }}
        >
          {/* NERDTree header */}
          <div
            className="px-3 py-2 text-[11px] uppercase tracking-wider"
            style={{ color: C.overlay0, borderBottom: `1px solid ${C.surface0}` }}
          >
            <span style={{ color: C.mauve }}>  </span>
            explorer
          </div>
          <div className="py-1">
            {tree.map((node) => renderNode(node, 0, ""))}
          </div>
        </div>

        {/* Editor pane */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Tab bar */}
          {currentFile && (
            <div
              className="flex items-center"
              style={{
                backgroundColor: C.mantle,
                borderBottom: `1px solid ${C.surface0}`,
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-1.5 text-[12px]"
                style={{
                  backgroundColor: C.base,
                  color: C.text,
                  borderRight: `1px solid ${C.surface0}`,
                }}
              >
                <span style={{ color: C.green }}>󰈙</span>
                {currentFile.path}
                <span style={{ color: C.surface2 }}>×</span>
              </div>
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 overflow-auto p-5">
            {currentFile ? (
              <article
                className="prose max-w-none"
                style={
                  {
                    "--tw-prose-body": C.subtext1,
                    "--tw-prose-headings": C.text,
                    "--tw-prose-links": C.blue,
                    "--tw-prose-bold": C.text,
                    "--tw-prose-code": C.peach,
                    "--tw-prose-th-borders": C.surface1,
                    "--tw-prose-td-borders": C.surface0,
                  } as React.CSSProperties
                }
              >
                <Markdown
                  rehypePlugins={[rehypeHighlight]}
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1
                        className="mb-3 mt-0 text-sm font-semibold"
                        style={{ color: C.text }}
                      >
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2
                        className="mb-2 mt-5 text-sm font-semibold"
                        style={{ color: C.lavender }}
                      >
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3
                        className="mb-2 mt-4 text-xs font-medium"
                        style={{ color: C.mauve }}
                      >
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p
                        className="mb-3 text-[13px] leading-relaxed"
                        style={{ color: C.subtext1 }}
                      >
                        {children}
                      </p>
                    ),
                    li: ({ children }) => (
                      <li
                        className="text-[13px]"
                        style={{ color: C.subtext1 }}
                      >
                        {children}
                      </li>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="underline decoration-1 underline-offset-2"
                        style={{ color: C.blue }}
                      >
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ color: C.text }}>
                        {children}
                      </strong>
                    ),
                    code: ({ className, children }) => {
                      const isBlock = className?.includes("hljs");
                      if (isBlock) {
                        return (
                          <code className={className}>{children}</code>
                        );
                      }
                      return (
                        <code
                          className="rounded px-1.5 py-0.5 text-[12px]"
                          style={{
                            backgroundColor: C.surface0,
                            color: C.peach,
                          }}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre
                        className="my-3 overflow-x-auto rounded-lg p-4 text-[13px] leading-[20px]"
                        style={{
                          backgroundColor: C.crust,
                          border: `1px solid ${C.surface0}`,
                        }}
                      >
                        {children}
                      </pre>
                    ),
                    table: ({ children }) => (
                      <table
                        className="my-3 w-full text-[13px]"
                        style={{ color: C.subtext1 }}
                      >
                        {children}
                      </table>
                    ),
                    th: ({ children }) => (
                      <th
                        className="border-b px-3 py-1.5 text-left text-xs font-medium"
                        style={{
                          borderColor: C.surface1,
                          color: C.subtext0,
                        }}
                      >
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td
                        className="border-b px-3 py-1.5"
                        style={{ borderColor: C.surface0 }}
                      >
                        {children}
                      </td>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote
                        className="my-3 border-l-2 pl-4 text-[13px]"
                        style={{
                          borderColor: C.yellow,
                          color: C.subtext0,
                        }}
                      >
                        {children}
                      </blockquote>
                    ),
                    hr: () => (
                      <hr
                        className="my-4"
                        style={{ borderColor: C.surface0 }}
                      />
                    ),
                  }}
                >
                  {currentFile.content}
                </Markdown>
              </article>
            ) : (
              <div
                className="flex h-full items-center justify-center text-sm"
                style={{ color: C.overlay0 }}
              >
                Select a file to view
              </div>
            )}
          </div>

          {/* Status bar (vim style) */}
          {currentFile && (
            <div
              className="flex items-center justify-between px-3 py-1 text-[11px]"
              style={{
                backgroundColor: C.surface0,
                color: C.subtext0,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="rounded px-1.5 py-0.5 font-semibold"
                  style={{ backgroundColor: C.blue, color: C.crust }}
                >
                  NORMAL
                </span>
                <span>
                  {currentFile.domain}/{currentFile.path}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span>v{currentFile.version}</span>
                <span style={{ color: C.green }}>
                  {currentFile.lastContributor}
                </span>
                <span>
                  {lineCount}L
                </span>
                <span>utf-8</span>
                <span>markdown</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
