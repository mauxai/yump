import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import type { ImageEditInput, ImageEditResult, ImageEditProvider } from "../types";

type ImagePart = { type: "image"; image: Buffer; mediaType: string };
type TextPart  = { type: "text";  text: string };
type ContentPart = ImagePart | TextPart;

export class GoogleProvider implements ImageEditProvider {
  constructor(private apiKey: string, private modelId: string) {}

  async editImage(input: ImageEditInput, prompt: string): Promise<ImageEditResult> {
    const { buffer, mediaType } = resolveBuffer(input);

    const google = createGoogleGenerativeAI({ apiKey: this.apiKey });

    // Build content array — primary image first, then any reference images, then prompt
    const contentParts: ContentPart[] = [
      { type: "image", image: buffer, mediaType },
    ];
    for (const ref of input.referenceImages ?? []) {
      contentParts.push({ type: "image", image: ref.buffer, mediaType: ref.mimeType });
    }
    contentParts.push({ type: "text", text: prompt });

    const result = await generateText({
      model: google(this.modelId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: "user", content: contentParts as any }],
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
    });

    const imageFile = result.files?.find((f) => f.mediaType.startsWith("image/"));

    if (!imageFile) {
      throw new Error(
        result.text
          ? `Gemini returned text instead of an image: ${result.text.slice(0, 200)}`
          : "Gemini did not return an image.",
      );
    }

    return {
      imageBase64: imageFile.base64,
      mimeType: imageFile.mediaType,
      textResponse: result.text || undefined,
      provider: "google",
      modelId: this.modelId,
    };
  }
}

/** Resolve any ImageEditInput form → raw Buffer + mediaType. No double conversion. */
function resolveBuffer(input: ImageEditInput): { buffer: Buffer; mediaType: string } {
  // Preferred: already a Buffer — use directly
  if (input.buffer) {
    return { buffer: input.buffer, mediaType: input.mimeType ?? "image/png" };
  }

  // Data URL from browser canvas or legacy DB value
  if (input.dataUrl) {
    const match = input.dataUrl.match(/^data:(.+?);base64,(.*)$/);
    if (!match) throw new Error("Invalid data URL");
    return { buffer: Buffer.from(match[2], "base64"), mediaType: match[1] };
  }

  // Raw base64 string fallback
  if (input.base64) {
    return { buffer: Buffer.from(input.base64, "base64"), mediaType: input.mimeType ?? "image/png" };
  }

  throw new Error("No image data provided.");
}
