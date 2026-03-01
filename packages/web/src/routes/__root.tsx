import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Compass, FolderOpen, Newspaper, Trophy } from "lucide-react";
import { RadarIcon } from "../components/RadarIcon";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="sticky top-0 z-50 bg-zinc-50/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-zinc-900">
            <RadarIcon className="size-6" />
            Radar
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <NavLink to="/explore" label="Explore" icon={<Compass className="h-4 w-4" />} />
            <NavLink to="/browse" label="Browse" icon={<FolderOpen className="h-4 w-4" />} />
            <NavLink to="/contributions" label="Feed" icon={<Newspaper className="h-4 w-4" />} />
            <NavLink to="/leaderboard" label="Leaderboard" icon={<Trophy className="h-4 w-4" />} />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-zinc-900 [&.active]:text-zinc-900"
    >
      {icon}
      {label}
    </Link>
  );
}
