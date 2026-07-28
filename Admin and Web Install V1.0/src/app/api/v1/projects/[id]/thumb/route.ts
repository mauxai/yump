import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { readImageAsDataUrl } from "@/lib/file-store";

/**
 * Serves a project image as raw image bytes.
 * Handles both legacy base64 DB values and new file-URL values.
 *
 * Query params:
 *   - `v=original` → the original upload; `v=<editId>` → that specific edit.
 *     Omitted → the latest edit (or original if none).
 *   - `lqip=1` → a tiny (~20px) blurred WebP placeholder for the blur-up
 *     loading effect on thumbnails.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const sp = new URL(req.url).searchParams;
  const lqip = sp.get("lqip") === "1";
  const version = sp.get("v");
  const session = await auth();
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (!u?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where =
    u.role === "admin"
      ? { id: params.id }
      : { id: params.id, userId: u.id };

  const project = await prisma.project.findFirst({
    where,
    select: {
      originalImage: true,
      edits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { image: true },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let storedValue: string;
  if (version && version !== "original") {
    // A specific edit — scoped to this (already ownership-checked) project.
    const edit = await prisma.edit.findFirst({
      where: { id: version, projectId: params.id },
      select: { image: true },
    });
    if (!edit) return NextResponse.json({ error: "Not found" }, { status: 404 });
    storedValue = edit.image;
  } else if (version === "original") {
    storedValue = project.originalImage;
  } else {
    storedValue = project.edits[0]?.image ?? project.originalImage;
  }

  // readImageAsDataUrl handles both: legacy "data:..." and new "/storage/..." or "https://..." URLs
  const dataUrl = await readImageAsDataUrl(storedValue);

  const match = dataUrl.match(/^data:(.+?);base64,(.*)$/);
  if (!match) {
    return NextResponse.json({ error: "Corrupt image" }, { status: 500 });
  }
  const bytes = Buffer.from(match[2], "base64");

  if (lqip) {
    // Tiny blurred placeholder: cheap to produce, ~1KB, safe to cache briefly.
    // Also report the source's display dimensions (orientation-aware) so the
    // client can size the placeholder to the exact box the full image occupies.
    const meta = await sharp(bytes).metadata();
    let w = meta.width ?? 0;
    let h = meta.height ?? 0;
    if (meta.orientation && meta.orientation >= 5) [w, h] = [h, w]; // 90° rotations swap

    const tiny = await sharp(bytes)
      .resize(20, 20, { fit: "inside" })
      .blur()
      .webp({ quality: 40 })
      .toBuffer();
    return new NextResponse(new Uint8Array(tiny), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=60",
        "Content-Length": String(tiny.length),
        "X-Img-W": String(w),
        "X-Img-H": String(h),
      },
    });
  }

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Content-Length": String(bytes.length),
    },
  });
}
