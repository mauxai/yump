"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { getClientIp } from "@/lib/get-ip";
import { putFile, getStorageConfig } from "@/lib/storage";
import { deleteImageFile } from "@/lib/file-store";

export type TemplateResult = { ok: true } | { ok: false; error: string };

async function saveUploadedImage(file: File): Promise<string> {
  const { filename } = await putFile(file, "templates");
  const cfg = await getStorageConfig();

  if (cfg.driver === "s3") {
    const base = cfg.publicUrlBase
      ? cfg.publicUrlBase.replace(/\/$/, "")
      : `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
    return `${base}/templates/${filename}`;
  }

  return `/storage/templates/${filename}`;
}

export async function createTemplate(fd: FormData): Promise<TemplateResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const title      = (fd.get("title") as string | null)?.trim() ?? "";
  const description = (fd.get("description") as string | null)?.trim() || null;
  const prompt     = (fd.get("prompt") as string | null)?.trim() ?? "";
  const categoryId = (fd.get("categoryId") as string | null)?.trim() || null;
  const sortOrder  = parseInt((fd.get("sortOrder") as string | null) ?? "0", 10) || 0;
  const isActive   = fd.get("isActive") !== "0";
  const imageFile  = fd.get("image") as File | null;

  if (!title)      return { ok: false, error: "Title is required." };
  if (!prompt)     return { ok: false, error: "Prompt is required." };
  if (!categoryId) return { ok: false, error: "Category is required." };
  if (!imageFile || imageFile.size === 0) return { ok: false, error: "Image is required." };

  let imageUrl: string;
  try {
    imageUrl = await saveUploadedImage(imageFile);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Image upload failed." };
  }

  const template = await prisma.template.create({
    data: { title, description, imageUrl, prompt, categoryId, sortOrder, isActive },
  });

  const cat = await prisma.templateCategory.findUnique({ where: { id: categoryId } });

  await logAdminAction(admin.id, "TEMPLATE_CREATE", {
    ip: getClientIp(),
    targetType: "template",
    targetId: template.id,
    after: { title, category: cat?.name ?? categoryId, isActive },
  });

  revalidatePath("/admin/templates");
  return { ok: true };
}

export async function updateTemplate(id: string, fd: FormData): Promise<TemplateResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const existing = await prisma.template.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Template not found." };

  const title       = (fd.get("title") as string | null)?.trim() ?? "";
  const description = (fd.get("description") as string | null)?.trim() || null;
  const prompt      = (fd.get("prompt") as string | null)?.trim() ?? "";
  const categoryId  = (fd.get("categoryId") as string | null)?.trim() || null;
  const sortOrder   = parseInt((fd.get("sortOrder") as string | null) ?? "0", 10) || 0;
  const isActive    = fd.get("isActive") !== "0";
  const imageFile   = fd.get("image") as File | null;

  if (!title)      return { ok: false, error: "Title is required." };
  if (!prompt)     return { ok: false, error: "Prompt is required." };
  if (!categoryId) return { ok: false, error: "Category is required." };

  let imageUrl = existing.imageUrl;
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await saveUploadedImage(imageFile);
      await deleteImageFile(existing.imageUrl).catch(() => {});
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Image upload failed." };
    }
  }

  await prisma.template.update({
    where: { id },
    data: { title, description, imageUrl, prompt, categoryId, sortOrder, isActive },
  });

  const cat = await prisma.templateCategory.findUnique({ where: { id: categoryId } });

  await logAdminAction(admin.id, "TEMPLATE_UPDATE", {
    ip: getClientIp(),
    targetType: "template",
    targetId: id,
    before: { title: existing.title },
    after: { title, category: cat?.name ?? categoryId, isActive },
  });

  revalidatePath("/admin/templates");
  return { ok: true };
}

export async function deleteTemplate(id: string): Promise<TemplateResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const existing = await prisma.template.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Template not found." };

  await prisma.template.delete({ where: { id } });
  await deleteImageFile(existing.imageUrl).catch(() => {});

  await logAdminAction(admin.id, "TEMPLATE_DELETE", {
    ip: getClientIp(),
    targetType: "template",
    targetId: id,
    before: { title: existing.title },
  });

  revalidatePath("/admin/templates");
  return { ok: true };
}

export async function createCategory(name: string): Promise<{ ok: true; id: string; name: string } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Category name is required." };

  const cat = await prisma.templateCategory.upsert({
    where: { name: trimmed },
    update: {},
    create: { id: randomUUID(), name: trimmed },
  });

  revalidatePath("/admin/templates/new");
  revalidatePath("/admin/templates");
  return { ok: true, id: cat.id, name: cat.name };
}

export async function deleteCategory(id: string): Promise<TemplateResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const trimmed = id.trim();
  if (!trimmed) return { ok: false, error: "Category ID is required." };

  try {
    // FK onDelete: SetNull handles nullifying templates.categoryId automatically
    await prisma.templateCategory.delete({ where: { id: trimmed } });
  } catch (e) {
    console.error("[deleteCategory] error:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Delete failed." };
  }

  revalidatePath("/admin/templates/new");
  revalidatePath("/admin/templates");
  return { ok: true };
}

export async function toggleTemplateActive(
  id: string,
  isActive: boolean,
): Promise<TemplateResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  await prisma.template.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/templates");
  return { ok: true };
}
