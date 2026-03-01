import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { RadarIcon } from "../components/RadarIcon";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="sticky top-0 z-50 bg-zinc-50/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-8 px-6 py-3">
          <Link to="/" className="flex items-center gap-2 font-serif text-lg italic text-zinc-900">
            <RadarIcon className="size-6" />
            radar
          </Link>
          <div className="flex items-center gap-6 font-serif text-[15px]">
            <NavLink to="/explore" label="explore" />
            <NavLink to="/browse" label="browse" />
            <NavLink to="/contributions" label="feed" />
            <NavLink to="/leaderboard" label="leaderboard" />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="text-zinc-400 transition-colors hover:text-zinc-900 [&.active]:text-zinc-900"
    >
      {label}
    </Link>
  );
}
