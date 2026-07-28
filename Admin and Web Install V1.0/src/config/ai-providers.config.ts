export interface ProviderCapability {
  generate: boolean;
  edit:     boolean;
  enhance:  boolean;
}

export interface AIProviderConfig {
  id:           string;
  name:         string;
  provider:     "google" | "openai";
  capabilities: ProviderCapability;
  maxTokens?:   number;
  supportsVision: boolean;
}

export const defaultProviders: AIProviderConfig[] = [
  {
    id:           "gemini-flash",
    name:         "Gemini Flash (Image)",
    provider:     "google",
    capabilities: { generate: true, edit: true, enhance: false },
    supportsVision: true,
  },
  {
    id:           "gpt-image-2",
    name:         "GPT Image 2",
    provider:     "openai",
    capabilities: { generate: true, edit: true, enhance: true },
    supportsVision: true,
  },
  {
    id:           "dall-e-3",
    name:         "DALL·E 3",
    provider:     "openai",
    capabilities: { generate: true, edit: false, enhance: false },
    supportsVision: false,
  },
];
