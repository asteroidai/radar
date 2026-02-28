/**
 * URL normalization utility shared across packages.
 */
export function normalizeUrl(rawUrl: string): {
  domain: string;
  path: string;
  url: string;
} {
  if (!rawUrl.includes("://")) rawUrl = `https://${rawUrl}`;
  const parsed = new URL(rawUrl);
  let domain = parsed.hostname.toLowerCase();
  if (domain.startsWith("www.")) domain = domain.slice(4);
  let path = parsed.pathname.toLowerCase();
  if (path.endsWith("/") && path.length > 1) path = path.slice(0, -1);
  if (path === "") path = "/";
  return { domain, path, url: `https://${domain}${path}` };
}
