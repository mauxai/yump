import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { saveImageFile } from "@/lib/file-store";

export const dynamic = "force-dynamic";

const MAX_BYTES = 500_000;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * POST /api/admin/gateway-image
 * Uploads a payment-gateway logo and returns its storage path. The path is
 * stored verbatim in the gateway config as `gateway_image`; every consumer
 * renders it via buildStorageUrl(`/storage/${gateway_image}`), so the value
 * must be relative to /storage/ (e.g. "gateways/<uuid>.png").
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 500KB)." }, { status: 413 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const stored = await saveImageFile(base64, file.type, "gateways");

  // saveImageFile returns "<publicPath>/gateways/<file>" for the local driver.
  // Strip the leading "storage/" so the stored value sits relative to /storage/
  // the way the consumers expect. S3 returns an absolute URL, left untouched.
  const path = stored.startsWith("http") ? stored : stored.replace(/^\/?storage\//, "");

  return NextResponse.json({ path });
}
