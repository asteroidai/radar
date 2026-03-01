import { useState, type ReactNode } from "react";
import { Copy, Check } from "lucide-react";

type Segment = { text: string; color?: string };
type Line = { prompt: true; cmd: string; args: Segment[] } | { prompt: false; segments: Segment[] } | { blank: true };

const c = {
  cmd: "text-zinc-200",
  domain: "text-cyan-400",
  path: "text-blue-400",
  string: "text-emerald-400",
  muted: "text-zinc-500",
};

const LINES: Line[] = [
  { prompt: true, cmd: "npx radar-cli", args: [
    { text: " search ", color: c.cmd },
    { text: "\"checkout flow\"", color: c.string },
  ]},
  { prompt: false, segments: [
    { text: "  amazon.com  flows/checkout    high  \"One-click checkout…\"", color: c.muted },
  ]},
  { prompt: false, segments: [
    { text: "  shopify.com flows/cart         med   \"Cart & checkout…\"", color: c.muted },
  ]},
  { blank: true },
  { prompt: true, cmd: "npx radar-cli", args: [
    { text: " read ", color: c.cmd },
    { text: "amazon.com", color: c.domain },
    { text: " ", color: c.muted },
    { text: "flows/checkout", color: c.path },
  ]},
  { prompt: false, segments: [
    { text: "  title: Amazon Checkout Flow", color: c.muted },
  ]},
  { prompt: false, segments: [
    { text: "  confidence: high · v4 · browser-agent", color: c.muted },
  ]},
  { prompt: false, segments: [
    { text: "  ---", color: c.muted },
  ]},
  { prompt: false, segments: [
    { text: "  Click #buy-now → confirm address → place order", color: c.muted },
  ]},
  { blank: true },
  { prompt: true, cmd: "npx radar-cli", args: [
    { text: " explore ", color: c.cmd },
    { text: "stripe.com", color: c.domain },
  ]},
  { prompt: false, segments: [
    { text: "  ✓ Queued exploration → stripe.com", color: c.muted },
  ]},
];

function renderSegments(segments: Segment[]): ReactNode {
  return segments.map((s, i) => (
    <span key={i} className={s.color}>{s.text}</span>
  ));
}

export function TerminalWidget() {
  const [copied, setCopied] = useState(false);
  const installCmd = "npx radar-cli";

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
          <span className="ml-2 flex items-center gap-1.5 text-xs text-zinc-500" />
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
        {LINES.map((line, i) => {
          if ("blank" in line) return <div key={i} className="h-3" />;
          if (line.prompt) {
            return (
              <div key={i}>
                <span className="text-emerald-500">$</span>{" "}
                <span className={c.cmd}>{line.cmd}</span>
                {renderSegments(line.args)}
              </div>
            );
          }
          return <div key={i}>{renderSegments(line.segments)}</div>;
        })}
      </div>
    </div>
  );
}
