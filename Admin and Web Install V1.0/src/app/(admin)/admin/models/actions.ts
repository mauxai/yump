"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { getClientIp } from "@/lib/get-ip";
import { AI_PROVIDERS, getCredentialFields } from "@/lib/ai-providers";

export type ModelResult = { ok: true } | { ok: false; error: string };

function parseCredentials(fd: FormData, providerId: string): Record<string, string> {
  const fields = getCredentialFields(providerId);
  const creds: Record<string, string> = {};
  for (const field of fields) {
    const val = (fd.get(`cred_${field.key}`) as string | null)?.trim() ?? "";
    if (val) creds[field.key] = val;
  }
  return creds;
}

function validatePayload(fd: FormData): {
  label: string;
  provider: string;
  modelId: string;
  credentials: Record<string, string>;
  notes: string;
  isActive: boolean;
  isDefault: boolean;
  creditCost: number;
} | { error: string } {
  const label = (fd.get("label") as string | null)?.trim() ?? "";
  const provider = (fd.get("provider") as string | null)?.trim() ?? "";
  const modelId = (fd.get("modelId") as string | null)?.trim() ?? "";
  const notes = (fd.get("notes") as string | null)?.trim() ?? "";
  const isActive = fd.get("isActive") === "1";
  const isDefault = fd.get("isDefault") === "1";
  const creditCost = Math.max(1, parseInt(fd.get("creditCost") as string ?? "1", 10) || 1);

  if (!label) return { error: "Label is required." };
  if (!provider || !(provider in AI_PROVIDERS)) return { error: "Invalid provider." };

  const providerDef = AI_PROVIDERS[provider];
  const models = providerDef.models as readonly { id: string; label: string }[];
  if (!modelId || !models.some((m) => m.id === modelId))
    return { error: "Invalid model for the selected provider." };

  const credentials = parseCredentials(fd, provider);

  // Check required credential fields
  for (const field of getCredentialFields(provider)) {
    if (field.required && !credentials[field.key]) {
      return { error: `${field.label} is required for ${providerDef.name}.` };
    }
  }

  return { label, provider, modelId, credentials, notes, isActive, isDefault, creditCost };
}

export async function createModel(fd: FormData): Promise<ModelResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = validatePayload(fd);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const { label, provider, modelId, credentials, notes, isActive, isDefault, creditCost } = parsed;
  const ip = getClientIp();

  if (isDefault) {
    await prisma.aiModel.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }

  const model = await prisma.aiModel.create({
    data: {
      label,
      provider,
      modelId,
      credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
      notes: notes || null,
      isActive,
      isDefault,
      creditCost,
    },
  });

  await logAdminAction(admin.id, "MODEL_CREATE", {
    ip,
    targetType: "model",
    targetId: model.id,
    after: { label, provider, modelId, isActive, isDefault },
  });

  revalidatePath("/admin/models");
  redirect("/admin/models");
}

export async function updateModel(id: string, fd: FormData): Promise<ModelResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const existing = await prisma.aiModel.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Model not found." };

  const parsed = validatePayload(fd);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const { label, provider, modelId, credentials, notes, isActive, isDefault, creditCost } = parsed;
  const ip = getClientIp();

  if (isDefault && !existing.isDefault) {
    await prisma.aiModel.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }

  // Merge: keep existing creds for fields not submitted (allows partial update)
  const existingCreds = (existing.credentials as Record<string, string> | null) ?? {};
  const mergedCreds = { ...existingCreds, ...credentials };

  await prisma.aiModel.update({
    where: { id },
    data: {
      label,
      provider,
      modelId,
      credentials: Object.keys(mergedCreds).length > 0 ? mergedCreds : undefined,
      notes: notes || null,
      isActive,
      isDefault,
      creditCost,
    },
  });

  await logAdminAction(admin.id, "MODEL_UPDATE", {
    ip,
    targetType: "model",
    targetId: id,
    before: { label: existing.label, provider: existing.provider, modelId: existing.modelId },
    after: { label, provider, modelId, isActive, isDefault },
  });

  revalidatePath("/admin/models");
  redirect("/admin/models");
}

export async function deleteModel(id: string): Promise<ModelResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const existing = await prisma.aiModel.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Model not found." };

  await prisma.aiModel.delete({ where: { id } });

  await logAdminAction(admin.id, "MODEL_DELETE", {
    ip: getClientIp(),
    targetType: "model",
    targetId: id,
    before: { label: existing.label, provider: existing.provider, modelId: existing.modelId },
  });

  revalidatePath("/admin/models");
  return { ok: true };
}

export async function toggleModelActive(id: string, isActive: boolean): Promise<ModelResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  await prisma.aiModel.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/models");
  return { ok: true };
}

export async function setDefaultModel(id: string): Promise<ModelResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  await prisma.aiModel.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  await prisma.aiModel.update({ where: { id }, data: { isDefault: true } });
  revalidatePath("/admin/models");
  return { ok: true };
}
