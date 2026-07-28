import type { ResolvedModel } from "./resolve-model";
import type { ImageEditProvider } from "./types";
import { GoogleProvider } from "./providers/google";
import { OpenAIProvider } from "./providers/openai";

/**
 * Creates the right provider instance from a resolved DB model config.
 * DB credentials take priority; env vars are the fallback.
 */
export function createProvider(model: ResolvedModel): ImageEditProvider {
  const creds = model.credentials;

  switch (model.provider) {
    case "google": {
      const apiKey = creds.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey)
        throw new Error(
          "Google API key not configured. Set it in Admin → AI Models or set GEMINI_API_KEY.",
        );
      return new GoogleProvider(apiKey, model.modelId);
    }

    case "openai": {
      const apiKey = creds.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey)
        throw new Error(
          "OpenAI API key not configured. Set it in Admin → AI Models or set OPENAI_API_KEY.",
        );
      const orgId = creds.organizationId || process.env.OPENAI_ORG_ID || undefined;
      return new OpenAIProvider(apiKey, model.modelId, orgId);
    }

    default:
      throw new Error(
        `Unsupported provider "${model.provider}". Add support in src/lib/ai-engine/factory.ts.`,
      );
  }
}
