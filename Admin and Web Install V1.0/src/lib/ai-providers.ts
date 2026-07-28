export type CredentialField = {
  key: string;
  label: string;
  type: "password" | "text" | "url";
  required: boolean;
  envName: string;
  placeholder?: string;
  hint?: string;
};

export type ProviderDefinition = {
  name: string;
  models: readonly { id: string; label: string }[];
  credentialFields: readonly CredentialField[];
};

export const AI_PROVIDERS: Record<string, ProviderDefinition> = {
  google: {
    name: "Google",
    credentialFields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        envName: "GEMINI_API_KEY",
        placeholder: "AIza…",
        hint: "Google AI Studio API key.",
      },
    ],
    models: [
      // Gemini 3 — latest generation (image output via responseModalities: IMAGE)
      { id: "gemini-3-pro-image-preview",   label: "Gemini 3 Pro Image — Preview" },
      { id: "gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash Image — Preview" },
      // Gemini 2.5 — state-of-the-art, conversational image editing
      { id: "gemini-2.5-flash-image",         label: "Gemini 2.5 Flash Image (Recommended)" },
      // { id: "gemini-2.5-flash-image-preview",  label: "Gemini 2.5 Flash Image — Preview" },
      // Gemini 2.0 — shutting down June 2026, kept for backwards compat
      // { id: "gemini-2.0-flash-preview-image-generation", label: "Gemini 2.0 Flash Image — Preview" },
      { id: "gemini-2.0-flash-exp",            label: "Gemini 2.0 Flash Experimental" },
    ],
  },

  openai: {
    name: "OpenAI",
    credentialFields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        envName: "OPENAI_API_KEY",
        placeholder: "sk-…",
      },
      {
        key: "organizationId",
        label: "Organization ID",
        type: "text",
        required: false,
        envName: "OPENAI_ORG_ID",
        placeholder: "org-…",
        hint: "Optional. Required for org-scoped usage.",
      },
    ],
    models: [
      // GPT Image series — images.edit with multi-image input (our template flow)
      { id: "gpt-image-2",          label: "GPT Image 2 (Recommended)" },
      { id: "gpt-image-2-2026-04-21", label: "GPT Image 2 (Apr 2026)" },
      { id: "gpt-image-1.5",        label: "GPT Image 1.5" },
      { id: "gpt-image-1",          label: "GPT Image 1" },
      { id: "gpt-image-1-mini",     label: "GPT Image 1 Mini" },
      { id: "chatgpt-image-latest", label: "ChatGPT Image (Latest)" },
    ],
  },

  // anthropic: {
  //   name: "Anthropic",
  //   credentialFields: [
  //     { key: "apiKey", label: "API Key", type: "password", required: true, envName: "ANTHROPIC_API_KEY", placeholder: "sk-ant-…" },
  //   ],
  //   models: [
  //     { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
  //     { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  //     { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  //     { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  //     { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
  //     { id: "claude-3-opus-20240229", label: "Claude 3 Opus" },
  //   ],
  // },

  // mistral: {
  //   name: "Mistral AI",
  //   credentialFields: [
  //     { key: "apiKey", label: "API Key", type: "password", required: true, envName: "MISTRAL_API_KEY" },
  //   ],
  //   models: [
  //     { id: "mistral-large-latest", label: "Mistral Large" },
  //     { id: "mistral-medium-latest", label: "Mistral Medium" },
  //     { id: "mistral-small-latest", label: "Mistral Small" },
  //     { id: "codestral-latest", label: "Codestral" },
  //     { id: "open-mixtral-8x22b", label: "Mixtral 8x22B" },
  //   ],
  // },

  // groq: {
  //   name: "Groq",
  //   credentialFields: [
  //     { key: "apiKey", label: "API Key", type: "password", required: true, envName: "GROQ_API_KEY", placeholder: "gsk_…" },
  //   ],
  //   models: [
  //     { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
  //     { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
  //     { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
  //     { id: "gemma2-9b-it", label: "Gemma 2 9B" },
  //   ],
  // },

  // cohere: {
  //   name: "Cohere",
  //   credentialFields: [
  //     { key: "apiKey", label: "API Key", type: "password", required: true, envName: "COHERE_API_KEY" },
  //   ],
  //   models: [
  //     { id: "command-r-plus-08-2024", label: "Command R+ (Aug 2024)" },
  //     { id: "command-r-08-2024", label: "Command R (Aug 2024)" },
  //     { id: "command-r-plus", label: "Command R+" },
  //     { id: "command-r", label: "Command R" },
  //   ],
  // },

  // azure: {
  //   name: "Azure OpenAI",
  //   credentialFields: [
  //     { key: "apiKey", label: "API Key", type: "password", required: true, envName: "AZURE_OPENAI_API_KEY" },
  //     { key: "endpoint", label: "Endpoint URL", type: "url", required: true, envName: "AZURE_OPENAI_ENDPOINT", placeholder: "https://YOUR-RESOURCE.openai.azure.com/" },
  //     { key: "deploymentName", label: "Deployment Name", type: "text", required: true, envName: "AZURE_OPENAI_DEPLOYMENT" },
  //   ],
  //   models: [
  //     { id: "gpt-4o", label: "GPT-4o" },
  //     { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
  //     { id: "gpt-35-turbo", label: "GPT-3.5 Turbo" },
  //   ],
  // },
};

export type ProviderId = keyof typeof AI_PROVIDERS;

export type ModelEntry = { id: string; label: string };

export function getProviderList() {
  return Object.entries(AI_PROVIDERS).map(([id, p]) => ({ id, name: p.name }));
}

export function getModelsForProvider(providerId: string): ModelEntry[] {
  return [...(AI_PROVIDERS[providerId]?.models ?? [])];
}

export function getCredentialFields(providerId: string): readonly CredentialField[] {
  return AI_PROVIDERS[providerId]?.credentialFields ?? [];
}

export function getProviderName(providerId: string): string {
  return AI_PROVIDERS[providerId]?.name ?? providerId;
}

export function getModelLabel(providerId: string, modelId: string): string {
  const models = getModelsForProvider(providerId);
  return models.find((m) => m.id === modelId)?.label ?? modelId;
}
