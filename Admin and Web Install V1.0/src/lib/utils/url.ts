/**
 * Converts a storage path to an absolute URL using APP_URL env var.
 * - Already-absolute URLs are returned unchanged.
 * - Legacy base64 data URLs are returned unchanged.
 * - All other paths (e.g. `/storage/...`) are prefixed with the app base URL.
 */
export function toAbsoluteUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("data:")) return path;
  const base = (
    process.env.NEXT_PUBLIC_STORAGE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

const EXT_MIME: Record<string, string> = {
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  webp: "image/webp",
  gif:  "image/gif",
  avif: "image/avif",
};

/**
 * Derives MIME type from a file URL or data URL.
 * Falls back to "image/png" for unknown extensions.
 */
export function mimeFromUrl(url: string): string {
  if (url.startsWith("data:")) {
    return url.match(/^data:(.+?);/)?.[1] ?? "image/png";
  }
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? "image/png";
}
