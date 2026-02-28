import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { GitBranch, User } from "lucide-react";
import type { KnowledgeFile } from "@/lib/mock-data";

export function MarkdownViewer({ file }: { file: KnowledgeFile | null }) {
  if (!file) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        Select a file to view its contents
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 space-y-2">
        <h2 className="text-xl font-bold text-zinc-900">{file.title}</h2>
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" />
            v{file.version}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {file.lastContributor}
          </span>
          <span className="text-zinc-300">|</span>
          <span>{file.changeReason}</span>
        </div>
      </div>
      <article className="prose prose-zinc max-w-none prose-headings:text-zinc-900 prose-h1:text-lg prose-h1:font-bold prose-h2:text-base prose-h2:font-semibold prose-h3:text-sm prose-h3:font-semibold prose-p:text-sm prose-p:leading-relaxed prose-a:text-emerald-600 prose-code:text-sm prose-pre:bg-zinc-900 prose-pre:text-sm prose-li:text-sm prose-table:text-sm">
        <Markdown rehypePlugins={[rehypeHighlight]} remarkPlugins={[remarkGfm]}>
          {file.content}
        </Markdown>
      </article>
    </div>
  );
}
