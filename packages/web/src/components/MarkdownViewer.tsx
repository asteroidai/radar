import { useState } from "react";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { GitBranch, User, FileCode, FileText } from "lucide-react";

interface FileData {
  path: string;
  title: string;
  content: string;
  version: number;
  lastContributor: string;
  lastChangeReason: string;
}

export function MarkdownViewer({ file }: { file: FileData | null }) {
  const [raw, setRaw] = useState(false);

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

        {/* Raw / Formatted toggle */}
        <div className="flex shrink-0 items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
          <button
            onClick={() => setRaw(false)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
              !raw
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <FileText className="h-3 w-3" />
            Formatted
          </button>
          <button
            onClick={() => setRaw(true)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
              raw
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <FileCode className="h-3 w-3" />
            Raw
          </button>
        </div>
      </div>

      {/* Content */}
      {raw ? (
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
        <article className="prose max-w-none prose-headings:text-zinc-900 prose-h1:text-sm prose-h1:font-semibold prose-h2:text-sm prose-h2:font-semibold prose-h3:text-xs prose-h3:font-medium prose-p:text-[13px] prose-p:leading-relaxed prose-p:text-zinc-600 prose-a:text-emerald-600 prose-strong:text-zinc-800 prose-code:text-[12px] prose-pre:bg-zinc-950 prose-pre:text-[13px] prose-li:text-[13px] prose-li:text-zinc-600 prose-th:text-xs prose-th:text-zinc-500 prose-td:text-[13px] prose-td:text-zinc-600 prose-blockquote:border-emerald-300 prose-blockquote:text-[13px] prose-blockquote:text-zinc-500 prose-hr:border-zinc-100">
          <Markdown
            rehypePlugins={[rehypeHighlight]}
            remarkPlugins={[remarkGfm]}
          >
            {file.content}
          </Markdown>
        </article>
      )}
    </div>
  );
}
