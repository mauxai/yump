import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { describeImageForTemplate } from "@/lib/ai-engine/describe-image";

export const maxDuration = 60;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { imageDataUrl?: string; modelId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageDataUrl, modelId } = body;
  if (!imageDataUrl?.startsWith("data:")) {
    return NextResponse.json({ error: "imageDataUrl is required" }, { status: 400 });
  }

  const match = imageDataUrl.match(/^data:(.+?);base64,(.*)$/);
  if (!match) {
    return NextResponse.json({ error: "Malformed data URL" }, { status: 400 });
  }

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");

  if (buffer.length > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large (max 8 MB)" }, { status: 400 });
  }

  try {
    const prompt = await describeImageForTemplate(buffer, mimeType, modelId);
    return NextResponse.json({ prompt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
