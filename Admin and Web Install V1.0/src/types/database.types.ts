export type UserStatus = "active" | "suspended";
export type AdminRole = "admin" | "superadmin";
export type UserKind = "user" | "admin";
export type JobStatus = "pending" | "running" | "done" | "failed";
export type BillingStatus = "paid" | "pending" | "failed" | "refunded";
export type JobType = "generate" | "edit" | "enhance";

export interface DBUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  passwordHash: string;
  status: UserStatus;
  lastActiveAt: Date | null;
  creditsUsed: number;
  creditsTotal: number;
  creditsResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBProject {
  id: string;
  userId: string;
  name: string;
  originalImage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBEdit {
  id: string;
  projectId: string;
  parentId: string | null;
  prompt: string;
  image: string;
  createdAt: Date;
}

export interface DBJob {
  id: string;
  userId: string;
  projectId: string | null;
  type: JobType;
  status: JobStatus;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  errorMsg: string | null;
  creditCost: number;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
}

export interface DBPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  isActive: boolean;
  recommended: boolean;
}

export interface DBSetting {
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
}
