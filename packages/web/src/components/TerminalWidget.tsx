import { useState } from "react";
import { Copy, Check } from "lucide-react";

const INSTALL_CMD = "npx -y @anthropic/mcp-server-radar";

export function TerminalWidget() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-zinc-500">~ — zsh</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>
      {/* Terminal body */}
      <div className="p-4 font-mono text-[13px] leading-6">
        <div className="text-zinc-600"># one command to give your agent the power of radar</div>
        <span className="text-emerald-500">$</span>{" "}
        <span className="text-zinc-200">{INSTALL_CMD}</span>
        <span className="ml-0.5 inline-block h-[14px] w-[7px] translate-y-[2px] animate-blink bg-zinc-400" />
      </div>
    </div>
  );
}
