const strip = (url: string) => url.replace(/\/$/, "");

// If NEXT_PUBLIC_STORAGE_URL is set, all stored assets are served from there
// (e.g. a CDN or separate object-storage origin). Falls back to APP_URL.
const STORAGE_BASE =
  process.env.NEXT_PUBLIC_STORAGE_URL
    ? strip(process.env.NEXT_PUBLIC_STORAGE_URL)
    : strip(process.env.NEXT_PUBLIC_APP_URL ?? "");

/** Builds a full URL for an avatar filename stored in /storage/avatars/. */
export function buildAvatarUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  if (filename.startsWith("data:") || filename.startsWith("http")) return filename;
  return `${STORAGE_BASE}/storage/avatars/${filename}`;
}

/** Builds a full URL for any stored file path. */
export function buildStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("data:") || path.startsWith("http")) return path;
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${STORAGE_BASE}${normalised}`;
}
