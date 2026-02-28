function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-orange-500",
  ];
  return colors[Math.abs(hash) % colors.length]!;
}

export function ContributorBadge({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${hashColor(name)}`}
      />
      <span className="font-mono text-sm text-zinc-700">{name}</span>
    </span>
  );
}
