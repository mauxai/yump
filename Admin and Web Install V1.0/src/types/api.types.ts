export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

// --- Projects ---
export interface ProjectSummary {
  id: string;
  name: string;
  edits: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  originalImage: string;
  editHistory: EditSummary[];
}

export interface EditSummary {
  id: string;
  prompt: string;
  image: string;
  createdAt: string;
}

// --- Images ---
export interface ImageUploadResponse {
  url: string;
  key: string;
  mimeType: string;
  sizeBytes: number;
}

// --- AI ---
export type AIJobType = "generate" | "edit" | "enhance";

export interface AIGenerateRequest {
  prompt: string;
  width?: number;
  height?: number;
  modelId?: string;
  projectId?: string;
}

export interface AIEditRequest {
  projectId: string;
  editId?: string;
  prompt: string;
  modelId?: string;
  sketchDataUrl?: string;
}

export interface AIEnhanceRequest {
  projectId: string;
  editId?: string;
  type: "upscale" | "denoise" | "sharpen";
  modelId?: string;
}

export interface AIJobResponse {
  jobId: string;
  status: "pending" | "running" | "done" | "failed";
  image?: string;
  creditCost: number;
}

// --- Jobs ---
export interface JobSummary {
  id: string;
  type: AIJobType;
  status: "pending" | "running" | "done" | "failed";
  creditCost: number;
  projectId: string | null;
  createdAt: string;
  finishedAt: string | null;
}

// --- Analytics ---
export interface UserAnalytics {
  totalProjects: number;
  totalEdits: number;
  creditsUsed: number;
  creditsTotal: number;
  creditsRemaining: number;
  recentActivity: ActivityEvent[];
}

export interface ActivityEvent {
  id: string;
  type: "project_created" | "edit_made" | "credit_purchased" | "plan_changed";
  description: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

// --- User ---
export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  status: string;
  creditsUsed: number;
  creditsTotal: number;
  createdAt: string;
}
