function SkeletonPhase() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      {/* Nav placeholder */}
      <rect x="20" y="15" width="80" height="12" rx="3" fill="#27272a" />
      <rect x="280" y="15" width="40" height="12" rx="3" fill="#27272a" />
      <rect x="330" y="15" width="50" height="12" rx="3" fill="#27272a" />

      {/* Pulsing skeleton rects */}
      <rect x="20" y="55" width="360" height="24" rx="4" fill="#27272a">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
      </rect>
      <rect x="20" y="90" width="280" height="16" rx="4" fill="#27272a">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
      </rect>
      <rect x="20" y="120" width="320" height="16" rx="4" fill="#27272a">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
      </rect>
      <rect x="20" y="160" width="360" height="80" rx="6" fill="#27272a">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" begin="0.6s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

function HomepagePhase() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      {/* Nav bar */}
      <rect x="0" y="0" width="400" height="40" fill="#18181b" />
      <rect x="20" y="14" width="60" height="12" rx="3" fill="#10b981" />
      <rect x="260" y="14" width="40" height="12" rx="2" fill="#3f3f46" />
      <rect x="310" y="14" width="40" height="12" rx="2" fill="#3f3f46" />
      <rect x="360" y="14" width="20" height="12" rx="2" fill="#3f3f46" />

      {/* Hero text */}
      <rect x="60" y="65" width="280" height="16" rx="3" fill="#a1a1aa" />
      <rect x="100" y="90" width="200" height="10" rx="2" fill="#52525b" />

      {/* CTA button */}
      <rect x="150" y="115" width="100" height="28" rx="6" fill="#10b981" />
      <rect x="168" y="125" width="64" height="8" rx="2" fill="#022c22" />

      {/* Three cards */}
      <rect x="20" y="170" width="110" height="90" rx="6" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
      <rect x="145" y="170" width="110" height="90" rx="6" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
      <rect x="270" y="170" width="110" height="90" rx="6" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

      {/* Card inner lines */}
      <rect x="32" y="185" width="60" height="8" rx="2" fill="#3f3f46" />
      <rect x="32" y="200" width="86" height="6" rx="2" fill="#3f3f46" opacity="0.5" />
      <rect x="157" y="185" width="60" height="8" rx="2" fill="#3f3f46" />
      <rect x="157" y="200" width="86" height="6" rx="2" fill="#3f3f46" opacity="0.5" />
      <rect x="282" y="185" width="60" height="8" rx="2" fill="#3f3f46" />
      <rect x="282" y="200" width="86" height="6" rx="2" fill="#3f3f46" opacity="0.5" />
    </svg>
  );
}

function CheckoutPhase() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      {/* Step indicator */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle
            cx={80 + i * 80}
            cy="30"
            r="12"
            fill={i === 0 ? "#10b981" : "#27272a"}
            stroke={i === 0 ? "#10b981" : "#3f3f46"}
            strokeWidth="1.5"
          />
          <text
            x={80 + i * 80}
            y="34"
            textAnchor="middle"
            fill={i === 0 ? "#022c22" : "#71717a"}
            fontSize="11"
            fontWeight="600"
          >
            {i + 1}
          </text>
          {i < 3 && (
            <line
              x1={92 + i * 80}
              y1="30"
              x2={148 + i * 80}
              y2="30"
              stroke="#3f3f46"
              strokeWidth="1.5"
            />
          )}
        </g>
      ))}

      {/* Step labels */}
      <text x="80" y="54" textAnchor="middle" fill="#a1a1aa" fontSize="9">Info</text>
      <text x="160" y="54" textAnchor="middle" fill="#52525b" fontSize="9">Shipping</text>
      <text x="240" y="54" textAnchor="middle" fill="#52525b" fontSize="9">Review</text>
      <text x="320" y="54" textAnchor="middle" fill="#52525b" fontSize="9">Payment</text>

      {/* Form heading */}
      <rect x="40" y="80" width="160" height="12" rx="3" fill="#a1a1aa" />

      {/* Form inputs */}
      <rect x="40" y="108" width="320" height="32" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      <rect x="52" y="120" width="80" height="8" rx="2" fill="#3f3f46" />
      <rect x="40" y="152" width="155" height="32" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      <rect x="52" y="164" width="60" height="8" rx="2" fill="#3f3f46" />
      <rect x="205" y="152" width="155" height="32" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      <rect x="217" y="164" width="60" height="8" rx="2" fill="#3f3f46" />
      <rect x="40" y="196" width="320" height="32" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      <rect x="52" y="208" width="100" height="8" rx="2" fill="#3f3f46" />

      {/* Next button */}
      <rect x="260" y="248" width="100" height="32" rx="6" fill="#10b981" />
      <text x="310" y="268" textAnchor="middle" fill="#022c22" fontSize="11" fontWeight="600">Next →</text>
    </svg>
  );
}

function SkipPhase() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      {/* Step indicator — steps 1-3 dim with strikethrough, step 4 emerald */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} opacity={i < 3 ? 0.35 : 1}>
          <circle
            cx={80 + i * 80}
            cy="30"
            r="12"
            fill={i === 3 ? "#10b981" : "#27272a"}
            stroke={i === 3 ? "#10b981" : "#3f3f46"}
            strokeWidth="1.5"
          />
          <text
            x={80 + i * 80}
            y="34"
            textAnchor="middle"
            fill={i === 3 ? "#022c22" : "#71717a"}
            fontSize="11"
            fontWeight="600"
          >
            {i + 1}
          </text>
          {i < 3 && (
            <line
              x1={92 + i * 80}
              y1="30"
              x2={148 + i * 80}
              y2="30"
              stroke="#3f3f46"
              strokeWidth="1.5"
            />
          )}
        </g>
      ))}

      {/* Strikethrough lines on steps 1-3 */}
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1={68 + i * 80}
          y1="40"
          x2={92 + i * 80}
          y2="20"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            from="0"
            to="0.7"
            dur="0.3s"
            begin={`${i * 0.15}s`}
            fill="freeze"
          />
        </line>
      ))}

      {/* Step labels */}
      <text x="80" y="54" textAnchor="middle" fill="#52525b" fontSize="9" opacity="0.35">Info</text>
      <text x="160" y="54" textAnchor="middle" fill="#52525b" fontSize="9" opacity="0.35">Shipping</text>
      <text x="240" y="54" textAnchor="middle" fill="#52525b" fontSize="9" opacity="0.35">Review</text>
      <text x="320" y="54" textAnchor="middle" fill="#a1a1aa" fontSize="9">Payment</text>

      {/* Skip label */}
      <text x="160" y="74" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="500" opacity="0">
        skipped via radar
        <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.4s" fill="freeze" />
      </text>

      {/* Single payment field */}
      <rect x="40" y="100" width="180" height="14" rx="3" fill="#a1a1aa" />

      <rect x="40" y="130" width="320" height="36" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      <rect x="56" y="143" width="120" height="10" rx="2" fill="#3f3f46" />

      <rect x="40" y="180" width="320" height="36" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
      <rect x="56" y="193" width="80" height="10" rx="2" fill="#3f3f46" />

      {/* Pay button */}
      <rect x="40" y="240" width="320" height="36" rx="6" fill="#10b981" />
      <text x="200" y="262" textAnchor="middle" fill="#022c22" fontSize="12" fontWeight="700">Pay now</text>
    </svg>
  );
}

function SuccessPhase() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      {/* Dimmed form background */}
      <rect x="40" y="20" width="320" height="140" rx="8" fill="#18181b" opacity="0.3" />

      {/* Checkmark circle */}
      <circle
        cx="200"
        cy="130"
        r="44"
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        strokeDasharray="276"
        strokeDashoffset="276"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="276"
          to="0"
          dur="0.6s"
          fill="freeze"
        />
      </circle>
      <circle cx="200" cy="130" r="40" fill="#10b981" opacity="0">
        <animate attributeName="opacity" from="0" to="0.15" dur="0.3s" begin="0.5s" fill="freeze" />
      </circle>

      {/* Checkmark */}
      <path
        d="M 180 130 L 194 146 L 222 114"
        fill="none"
        stroke="#10b981"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="60"
        strokeDashoffset="60"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="60"
          to="0"
          dur="0.4s"
          begin="0.4s"
          fill="freeze"
        />
      </path>

      {/* Payment complete text */}
      <text x="200" y="200" textAnchor="middle" fill="#a1a1aa" fontSize="14" fontWeight="600" opacity="0">
        Payment complete
        <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.6s" fill="freeze" />
      </text>
      <text x="200" y="222" textAnchor="middle" fill="#52525b" fontSize="10" opacity="0">
        Session verified successfully
        <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.8s" fill="freeze" />
      </text>
    </svg>
  );
}

const PHASES = [SkeletonPhase, HomepagePhase, CheckoutPhase, SkipPhase, SuccessPhase];

export function BrowserBody({ phase }: { phase: number }) {
  return (
    <div className="relative min-h-[400px]">
      {PHASES.map((Phase, i) => (
        <div
          key={i}
          className="absolute inset-0 p-2 transition-all duration-700 ease-out"
          style={{
            opacity: phase === i ? 1 : 0,
            pointerEvents: phase === i ? "auto" : "none",
          }}
        >
          <Phase />
        </div>
      ))}
    </div>
  );
}
