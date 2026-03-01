import { useState, useEffect } from "react";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { GitBranch, User, FileCode, FileText, History } from "lucide-react";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import type { Id } from "../../../../convex/_generated/dataModel";

interface FileData {
  _id?: Id<"files">;
  path: string;
  title: string;
  content: string;
  version: number;
  lastContributor: string;
  lastChangeReason: string;
}

export function MarkdownViewer({ file }: { file: FileData | null }) {
  const [raw, setRaw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Reset history view when file changes
  useEffect(() => {
    setShowHistory(false);
  }, [file?._id]);

  if (!file) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        Select a file to view its contents
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h2 className="text-base font-semibold text-zinc-900">{file.title}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500">
              <GitBranch className="h-3 w-3" />
              v{file.version}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {file.lastContributor}
            </span>
            <span className="text-zinc-300">&middot;</span>
            <span>{file.lastChangeReason}</span>
          </div>
        </div>

        {/* Raw / Formatted toggle + History button */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
            <button
              onClick={() => { setRaw(false); setShowHistory(false); }}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
                !raw && !showHistory
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <FileText className="h-3 w-3" />
              Formatted
            </button>
            <button
              onClick={() => { setRaw(true); setShowHistory(false); }}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
                raw && !showHistory
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <FileCode className="h-3 w-3" />
              Raw
            </button>
          </div>
          {file._id && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                showHistory
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-zinc-200 bg-zinc-50 text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <History className="h-3 w-3" />
              History
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {showHistory && file._id ? (
        <VersionHistoryPanel
          fileId={file._id}
          filePath={file.path}
          onBack={() => setShowHistory(false)}
        />
      ) : raw ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
            <span className="text-xs text-zinc-500">{file.path}</span>
            <span className="text-xs text-zinc-600">
              {file.content.split("\n").length} lines
            </span>
          </div>
          <div className="overflow-x-auto p-4">
            <pre className="raw-markdown">{file.content}</pre>
          </div>
        </div>
      ) : (
        <article className="max-w-none">
          <Markdown
            rehypePlugins={[rehypeHighlight]}
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-3 mt-0 text-base font-semibold text-zinc-900">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-2 mt-6 text-sm font-semibold text-zinc-800">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-4 text-xs font-medium text-zinc-700">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-3 text-[13px] leading-relaxed text-zinc-600">
                  {children}
                </p>
              ),
              li: ({ children }) => (
                <li className="text-[13px] text-zinc-600">{children}</li>
              ),
              ul: ({ children }) => (
                <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-emerald-600 underline decoration-1 underline-offset-2 hover:text-emerald-700"
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-zinc-800">{children}</strong>
              ),
              code: ({ className, children }) => {
                const isBlock = className?.includes("hljs");
                if (isBlock) {
                  return <code className={className}>{children}</code>;
                }
                return (
                  <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[12px] text-emerald-700">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="my-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-950 p-4 text-[13px] leading-[20px]">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <table className="my-3 w-full text-[13px] text-zinc-600">
                  {children}
                </table>
              ),
              th: ({ children }) => (
                <th className="border-b border-zinc-200 px-3 py-1.5 text-left text-xs font-medium text-zinc-500">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-zinc-100 px-3 py-1.5">
                  {children}
                </td>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-3 border-l-2 border-emerald-300 pl-4 text-[13px] text-zinc-500">
                  {children}
                </blockquote>
              ),
              hr: () => <hr className="my-4 border-zinc-100" />,
            }}
          >
            {file.content}
          </Markdown>
        </article>
      )}
    </div>
  );
}
