import { mutation } from "./_generated/server";

type FileType =
  | "readme"
  | "sitemap"
  | "flow"
  | "script"
  | "selectors"
  | "api"
  | "guide";

function inferType(path: string): FileType {
  if (path === "README") return "readme";
  if (path === "sitemap") return "sitemap";
  if (path.startsWith("flows/")) return "flow";
  if (path.startsWith("scripts/")) return "script";
  if (path.startsWith("selectors/") || path.startsWith("elements/")) return "selectors";
  if (path.startsWith("api/")) return "api";
  return "guide";
}

export const backfillFileTypes = mutation({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("files").collect();
    let updated = 0;

    for (const file of files) {
      if (!file.type) {
        const type = inferType(file.path);
        await ctx.db.patch(file._id, { type });
        updated++;
      }
    }

    return { updated, total: files.length };
  },
});
