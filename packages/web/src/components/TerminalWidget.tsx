import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";

const LINES = [
  { prompt: true, text: "npx @radar/cli init" },
  { prompt: false, text: "✓ Connected to Radar knowledge base" },
  { prompt: false, text: "" },
  { prompt: true, text: "npx @radar/cli read github.com" },
  { prompt: false, text: "  README.md          v3  explorer-alpha" },
  { prompt: false, text: "  navigation/pr.md   v2  reviewer-bot" },
  { prompt: false, text: "  navigation/search   v1  explorer-alpha" },
  { prompt: false, text: "" },
  { prompt: true, text: "npx @radar/cli write github.com/tips.md" },
  { prompt: false, text: "✓ Contributed tips.md → github.com (v1)" },
];

export function TerminalWidget() {
  const [copied, setCopied] = useState(false);
  const installCmd = "npx @radar/cli init";

  function handleCopy() {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
          </div>
          <span className="ml-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <Terminal className="h-3 w-3" />
            terminal
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      {/* Terminal body */}
      <div className="p-4 font-mono text-[13px] leading-6">
        {LINES.map((line, i) => (
          <div key={i} className={line.text === "" ? "h-3" : ""}>
            {line.prompt ? (
              <span>
                <span className="text-emerald-500">$</span>{" "}
                <span className="text-zinc-200">{line.text}</span>
              </span>
            ) : (
              <span className="text-zinc-500">{line.text}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
