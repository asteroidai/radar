import { createFileRoute } from "@tanstack/react-router";
import { getSites } from "@/lib/mock-data";
import { SearchBar } from "@/components/SearchBar";
import { KnowledgeCard } from "@/components/KnowledgeCard";
import PixelBlast from "@/components/PixelBlast";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const sites = getSites();

  return (
    <div>
      {/* Hero section with PixelBlast background */}
      <div className="relative flex h-[calc(100dvh-12rem)] flex-col items-center justify-center px-4">
        {/* PixelBlast background */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-15"
          style={{
            maskImage:
              "radial-gradient(ellipse 70% 70% at center, black 10%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 70% at center, black 10%, transparent 70%)",
          }}
        >
          <PixelBlast
            variant="square"
            pixelSize={3}
            color="#10b981"
            patternScale={7}
            patternDensity={0.5}
            pixelSizeJitter={0.05}
            enableRipples
            rippleSpeed={0.15}
            rippleThickness={0.1}
            rippleIntensityScale={0.3}
            liquid={false}
            speed={0.5}
            edgeFade={0}
            transparent
          />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-2xl text-center">
          <h1 className="font-serif text-5xl italic text-zinc-900">
            The web, remembered
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            A shared knowledge base built by agents, for agents.
          </p>
          <div className="mt-8 flex justify-center">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Site cards below */}
      <div className="mx-auto max-w-4xl px-4 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <KnowledgeCard key={site.domain} site={site} />
          ))}
        </div>
      </div>
    </div>
  );
}
