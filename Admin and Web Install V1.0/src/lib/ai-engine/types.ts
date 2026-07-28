export type ImageEditInput = {
  buffer?: Buffer;   // raw binary — preferred, avoids double base64 conversion
  dataUrl?: string;  // data:image/...;base64,... — browser canvas / legacy
  base64?: string;   // raw base64 string — fallback
  mimeType?: string; // e.g. "image/png"
  // Optional reference images sent alongside the primary (OpenAI gpt-image-1 multi-image edit).
  // Ordering contract: index 0 = face/identity reference (user photo).
  // The primary buffer is always the scene being edited (e.g. template image).
  referenceImages?: { buffer: Buffer; mimeType: string }[];
};

export type ImageEditResult = {
  imageBase64: string;
  mimeType: string;
  textResponse?: string;
  provider: string;
  modelId: string;
};

export interface ImageEditProvider {
  editImage(input: ImageEditInput, prompt: string): Promise<ImageEditResult>;
}
