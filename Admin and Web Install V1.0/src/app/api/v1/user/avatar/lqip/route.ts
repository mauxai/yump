import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const AVATARS_DIR = path.join(process.cwd(), "public", "storage", "avatars");

/**
 * Tiny (~20px) blurred WebP of the current user's avatar, used for the
 * blur-up loading effect on the profile avatar. Returns 404 when there's no
 * avatar or it can't be read — the client then falls back to the shimmer.
 */
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  });
  const avatar = user?.avatar;
  if (!avatar) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let buffer: Buffer;
  try {
    if (avatar.startsWith("data:")) {
      const m = avatar.match(/^data:(.+?);base64,(.*)$/);
      if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
      buffer = Buffer.from(m[2], "base64");
    } else if (avatar.startsWith("http")) {
      const resp = await fetch(avatar);
      if (!resp.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      buffer = Buffer.from(await resp.arrayBuffer());
    } else {
      // Local file — basename() guards against path traversal.
      buffer = await fs.readFile(path.join(AVATARS_DIR, path.basename(avatar)));
    }
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tiny = await sharp(buffer)
    .resize(20, 20, { fit: "inside" })
    .blur()
    .webp({ quality: 40 })
    .toBuffer();

  return new NextResponse(new Uint8Array(tiny), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=60",
      "Content-Length": String(tiny.length),
    },
  });
}
