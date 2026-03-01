const logEntries: Array<{
  icon: string;
  label: string;
  detail?: string;
}> = [
  { icon: "\u{1F310}", label: "Navigating to stripe.com" },
  {
    icon: "\u{1F50D}",
    label: "Searching via Radar",
    detail: 'stripe.com \u2014 "checkout flow"',
  },
  { icon: "\u{1F4C4}", label: "Radar returned 14 files" },
  {
    icon: "\u{1F4A1}",
    label: "Tip: skip multi-page form",
    detail: "Use /checkout/sessions/new?mode=payment",
  },
  {
    icon: "\u{1F310}",
    label: "Going to checkout",
    detail: "stripe.com/checkout",
  },
  { icon: "\u2713", label: "Using optimized flow", detail: "5 steps \u2192 1" },
];

export const LOG_ENTRY_COUNT = logEntries.length;

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1 pl-6">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1 w-1 rounded-full bg-zinc-500"
          style={{
            animation: "thinking-dot 1.4s ease-in-out infinite",
            animationDelay: `${i * 200}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function ActivityLog({
  visibleGroups,
  thinkingAfter,
}: {
  visibleGroups: Set<number>;
  thinkingAfter: number | null;
}) {
  return (
    <div className="flex flex-col">
      <style>{`
        @keyframes thinking-dot {
          0%, 80%, 100% { opacity: 0.15; transform: scale(0.8); }
          40% { opacity: 0.8; transform: scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="px-3 pb-2 pt-3">
        <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          Agent Activity
        </span>
      </div>

      {/* Entries */}
      <div className="flex flex-col">
        {logEntries.map((entry, i) => (
          <div key={i}>
            <div
              className="transition-all duration-700 ease-out"
              style={{
                opacity: visibleGroups.has(i) ? 1 : 0,
                transform: visibleGroups.has(i)
                  ? "translateY(0)"
                  : "translateY(6px)",
              }}
            >
              <div
                className={`px-3 py-2 ${i > 0 ? "border-t border-zinc-800/40" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-xs leading-4">
                    {entry.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs leading-4 text-zinc-300">
                      {entry.label}
                    </div>
                    {entry.detail && (
                      <div className="mt-0.5 text-[11px] leading-4 text-zinc-600">
                        {entry.detail}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {thinkingAfter === i && <ThinkingDots />}
          </div>
        ))}
      </div>
    </div>
  );
}
