import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/stdio.ts", "src/http.ts", "src/http-dev.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: true,
  noExternal: [/convex\/_generated/],
});
