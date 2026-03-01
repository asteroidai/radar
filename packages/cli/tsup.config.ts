import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: true,
  banner: { js: "#!/usr/bin/env node" },
  // Bundle everything except runtime node_modules dependencies.
  // This inlines the convex/_generated/api.js import that uses a
  // monorepo-relative path, making the output self-contained for npm.
  noExternal: [/convex\/_generated/],
});
