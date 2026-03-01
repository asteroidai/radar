import { useEffect, useRef, useState } from "react";
import { ActivityLog, LOG_ENTRY_COUNT } from "./AgentDemoWidget";
import { BrowserBody } from "./BrowserMockup";

const THINK_DELAY = 500;
const RESTART_DELAY = 3000;

// Log entries and browser phases on separate timelines.
// The agent navigates, researches with Radar, then acts on what it learned.
//
// t=0     Log 0 (Navigating to stripe.com)  Phase 0 (Skeleton)
// t=800                                     Phase 1 (Homepage loads)
// t=1800  Log 1 (Searching via Radar)       (homepage stays)
// t=3000  Log 2 (Radar returned 14 files)   (homepage stays)
// t=4200  Log 3 (Tip: skip form)            (homepage stays)
// t=5600  Log 4 (Going to checkout)         Phase 2 (Checkout form)
// t=7000  Log 5 (Using optimized flow)
// t=7400                                    Phase 3 (Skip!)
// t=8200                                    Phase 4 (Success)
const LOG_TIMES = [0, 1800, 3000, 4200, 5600, 7000];
const PHASE_TIMES = [0, 800, 5600, 7400, 8200];

const URLS: Record<number, { text: string; highlight?: boolean }> = {
  0: { text: "stripe.com" },
  1: { text: "stripe.com" },
  2: { text: "stripe.com/checkout" },
  3: { text: "stripe.com/checkout/sessions/new?mode=payment", highlight: true },
  4: { text: "stripe.com/checkout/sessions/success" },
};

export function AgentDemoSection() {
  const [visibleGroups, setVisibleGroups] = useState<Set<number>>(new Set());
  const [thinkingAfter, setThinkingAfter] = useState<number | null>(null);
  const [phase, setPhase] = useState(-1);
  const [cycle, setCycle] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  // IntersectionObserver — triggers first cycle
  useEffect(() => {
    const el = containerRef.current;
    if (!el || hasStartedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        hasStartedRef.current = true;
        setCycle(1);
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animation cycle — runs whenever cycle changes
  useEffect(() => {
    if (cycle === 0) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    setVisibleGroups(new Set());
    setThinkingAfter(null);
    setPhase(-1);

    // Schedule log entries
    for (let i = 0; i < LOG_ENTRY_COUNT; i++) {
      timeouts.push(
        setTimeout(() => {
          setThinkingAfter((prev) => (prev === i - 1 ? null : prev));
          setVisibleGroups((prev) => new Set([...prev, i]));
        }, LOG_TIMES[i]!),
      );

      if (i < LOG_ENTRY_COUNT - 1) {
        timeouts.push(
          setTimeout(() => {
            setThinkingAfter(i);
          }, LOG_TIMES[i]! + THINK_DELAY),
        );
      }
    }

    // Schedule browser phases (slightly lagging for tip → skip causality)
    for (let i = 0; i < PHASE_TIMES.length; i++) {
      timeouts.push(
        setTimeout(() => setPhase(i), PHASE_TIMES[i]!),
      );
    }

    // Schedule next cycle
    const totalTime =
      Math.max(LOG_TIMES.at(-1)!, PHASE_TIMES.at(-1)!) + RESTART_DELAY;
    timeouts.push(
      setTimeout(() => setCycle((c) => c + 1), totalTime),
    );

    return () => timeouts.forEach(clearTimeout);
  }, [cycle]);

  const url = URLS[Math.max(0, Math.min(phase, 4))];

  return (
    <div ref={containerRef} className="flex justify-center">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Chrome title bar */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 rounded-md bg-zinc-900 px-3 py-1">
            <span
              className={`text-xs transition-colors duration-500 ${
                url?.highlight ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              {url?.text ?? "stripe.com"}
            </span>
          </div>
        </div>

        {/* Browser body: SVG left + Activity log right */}
        <div className="flex">
          <div className="min-w-0 flex-1 bg-zinc-950">
            <BrowserBody key={cycle} phase={phase} />
          </div>
          <div className="hidden w-64 shrink-0 border-l border-zinc-800 lg:flex">
            <ActivityLog
              visibleGroups={visibleGroups}
              thinkingAfter={thinkingAfter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
