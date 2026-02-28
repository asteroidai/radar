import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";

let cachedClient: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (cachedClient) return cachedClient;

  const url = process.env.CONVEX_URL;
  if (!url) {
    throw new Error("CONVEX_URL environment variable is required");
  }
  cachedClient = new ConvexHttpClient(url);
  return cachedClient;
}

export { api };
