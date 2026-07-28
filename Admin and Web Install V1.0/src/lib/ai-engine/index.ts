/**
 * AI Engine — unified image editing interface.
 *
 * Usage:
 *   import { editImage } from "@/lib/ai-engine";
 *   const result = await editImage({ dataUrl }, prompt);
 *
 * The active model is resolved from the `ai_models` DB table (Admin → AI Models).
 * Credentials stored in the DB take priority over env-var fallbacks.
 */

import { resolveActiveModel, resolveModelById } from "./resolve-model";
import { createProvider } from "./factory";
import type { ImageEditInput, ImageEditResult } from "./types";

export type { ImageEditInput, ImageEditResult };
export { resolveActiveModel, resolveModelById };

/**
 * Edit an image using the default active AI model from the database.
 */
export async function editImage(
  input: ImageEditInput,
  prompt: string,
): Promise<ImageEditResult> {
  const model = await resolveActiveModel();
  const provider = createProvider(model);
  return provider.editImage(input, prompt);
}

/**
 * Edit an image using a specific model by its DB id.
 * Useful when the caller wants to select a non-default model.
 */
export async function editImageWithModel(
  modelId: string,
  input: ImageEditInput,
  prompt: string,
): Promise<ImageEditResult> {
  const model = await resolveModelById(modelId);
  const provider = createProvider(model);
  return provider.editImage(input, prompt);
}
