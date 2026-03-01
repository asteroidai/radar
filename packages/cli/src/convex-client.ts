import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";

const DEFAULT_CONVEX_URL = "https://tough-bird-920.convex.cloud";

let cachedClient: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (cachedClient) return cachedClient;

  const url = process.env.CONVEX_URL ?? DEFAULT_CONVEX_URL;
  cachedClient = new ConvexHttpClient(url);
  return cachedClient;
}

export { api };
