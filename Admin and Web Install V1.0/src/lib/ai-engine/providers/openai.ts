import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import type { ImageEditInput, ImageEditResult, ImageEditProvider } from "../types";

export class OpenAIProvider implements ImageEditProvider {
  constructor(
    private apiKey: string,
    private modelId: string,
    private organizationId?: string,
  ) {}

  async editImage(input: ImageEditInput, prompt: string): Promise<ImageEditResult> {
    const { buffer } = resolveBuffer(input);

    const client = new OpenAI({
      apiKey: this.apiKey,
      ...(this.organizationId ? { organization: this.organizationId } : {}),
    });

    // Scope B: cap to 1536px (OpenAI's max supported size) then convert to RGBA PNG
    const capped = await capTo1536(buffer);
    const primaryMeta = await sharp(capped).metadata();
    const primaryPng = await toRgbaPng(capped);
    const imageFile = await toFile(primaryPng, "image.png", { type: "image/png" });

    // Build image array — primary + optional reference images (gpt-image-1 supports multiple)
    // Resize each reference to match primary dimensions and convert to RGBA PNG
    const refs = input.referenceImages ?? [];
    const imageInput = refs.length > 0
      ? [
          imageFile,
          ...await Promise.all(
            refs.map(async (r, i) => {
              const refPng = await sharp(r.buffer)
                .resize(primaryMeta.width, primaryMeta.height, { fit: "cover" })
                .ensureAlpha()
                .png()
                .toBuffer();
              return toFile(refPng, `reference_${i}.png`, { type: "image/png" });
            })
          ),
        ]
      : imageFile;

    const response = await client.images.edit({
      model: this.modelId,
      image: imageInput as Parameters<typeof client.images.edit>[0]["image"],
      prompt,
      n: 1,
      quality: "high",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI did not return an image.");

    return {
      imageBase64: b64,
      mimeType: "image/png",
      provider: "openai",
      modelId: this.modelId,
    };
  }
}

/** Cap longest side to 1536px (OpenAI's max); no-op if already within bounds. */
async function capTo1536(buf: Buffer, max = 1536): Promise<Buffer> {
  const { width = 0, height = 0 } = await sharp(buf).metadata();
  if (width <= max && height <= max) return buf;
  return sharp(buf).resize(max, max, { fit: "inside", withoutEnlargement: true }).toBuffer();
}

/** Convert any image buffer to RGBA PNG — required by OpenAI images.edit. */
async function toRgbaPng(buf: Buffer): Promise<Buffer> {
  return sharp(buf).ensureAlpha().png().toBuffer();
}

/** Resolve any ImageEditInput form → raw Buffer + mimeType. No double conversion. */
function resolveBuffer(input: ImageEditInput): { buffer: Buffer; mimeType: string } {
  // Preferred: already a Buffer — use directly
  if (input.buffer) {
    return { buffer: input.buffer, mimeType: input.mimeType ?? "image/png" };
  }

  // Data URL from browser canvas or legacy DB value
  if (input.dataUrl) {
    const match = input.dataUrl.match(/^data:(.+?);base64,(.*)$/);
    if (!match) throw new Error("Invalid data URL");
    return { buffer: Buffer.from(match[2], "base64"), mimeType: match[1] };
  }

  // Raw base64 string fallback
  if (input.base64) {
    return { buffer: Buffer.from(input.base64, "base64"), mimeType: input.mimeType ?? "image/png" };
  }

  throw new Error("No image data provided.");
}
