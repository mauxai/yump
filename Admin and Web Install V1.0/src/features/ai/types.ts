export type AIOperation = "generate" | "edit" | "enhance";
export type EnhanceType = "upscale" | "denoise" | "sharpen";

export interface AIRequest {
  operation:    AIOperation;
  prompt:       string;
  modelId?:     string;
  projectId?:   string;
  editId?:      string;
  sourceImage?: string;
  enhanceType?: EnhanceType;
  sketchDataUrl?: string;
}

export interface AIResult {
  image:       string;
  mimeType:    string;
  editId?:     string;
  provider:    string;
  creditCost:  number;
}

export interface ProviderModel {
  id:           string;
  name:         string;
  provider:     string;
  capabilities: Record<string, boolean>;
  creditCost:   number | null;
}
