export function AsteroidIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Asteroid/meteor shape */}
      <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.9" />
      <circle cx="10" cy="10.5" r="1.2" fill="currentColor" opacity="0.4" />
      <circle cx="14" cy="12.5" r="0.8" fill="currentColor" opacity="0.4" />
      <circle cx="11.5" cy="14" r="0.6" fill="currentColor" opacity="0.3" />
      {/* Trail */}
      <path
        d="M16 8 L20 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M17 10 L21 7"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M15.5 7 L18 4.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export function BrowserUseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Browser window */}
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Title bar */}
      <line
        x1="3"
        y1="9"
        x2="21"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Dots */}
      <circle cx="6.5" cy="6.5" r="0.8" fill="currentColor" />
      <circle cx="9" cy="6.5" r="0.8" fill="currentColor" />
      <circle cx="11.5" cy="6.5" r="0.8" fill="currentColor" />
      {/* Play triangle */}
      <path d="M10.5 13 L10.5 17.5 L15 15.25 Z" fill="currentColor" />
    </svg>
  );
}
