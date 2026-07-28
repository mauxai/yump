import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In production (`next start`) Next.js only serves public/ assets that existed
// at build time — files uploaded at runtime (project images, avatars, logos)
// 404 from the static server. This catch-all picks up exactly those requests:
// build-time assets are still served statically and never reach this route.
const STORAGE_ROOT = path.join(process.cwd(), "public", "storage");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const filePath = path.normalize(path.join(STORAGE_ROOT, ...params.path));
  if (!filePath.startsWith(STORAGE_ROOT + path.sep)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat || !stat.isFile()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const stream = Readable.toWeb(
    fs.createReadStream(filePath),
  ) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "Content-Length": String(stat.size),
      // Stored files are content-addressed (unique name per upload), so they
      // are safe to cache forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
