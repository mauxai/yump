"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { saveAvatarFile, removeAvatarFile } from "@/lib/avatar";
import { buildAvatarUrl } from "@/lib/storage-url";

export type ActionResult = { ok: true; message: string; avatar?: string } | { ok: false; error: string };

export async function updateAdminProfile(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (name.length > 80) return { ok: false, error: "Name must be under 80 characters." };

  await prisma.admin.update({ where: { id: admin.id }, data: { name: name || null } });
  revalidatePath("/admin");
  return { ok: true, message: "Profile updated." };
}

export async function updateAdminEmail(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: "Invalid email address." };

  const record = await prisma.admin.findUnique({ where: { id: admin.id } });
  if (!record) return { ok: false, error: "Admin not found." };

  const ok = await bcrypt.compare(password, record.passwordHash);
  if (!ok) return { ok: false, error: "Incorrect current password." };

  if (email === record.email) return { ok: false, error: "That is already your email." };

  const exists = await prisma.admin.findUnique({ where: { email } });
  if (exists) return { ok: false, error: "Email is already in use." };

  await prisma.admin.update({ where: { id: admin.id }, data: { email } });
  revalidatePath("/admin");
  return { ok: true, message: "Email updated." };
}

export async function updateAdminPassword(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const current = (formData.get("current") as string | null) ?? "";
  const next = (formData.get("next") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  if (next.length < 8) return { ok: false, error: "New password must be at least 8 characters." };
  if (next !== confirm) return { ok: false, error: "Passwords do not match." };

  const record = await prisma.admin.findUnique({ where: { id: admin.id } });
  if (!record) return { ok: false, error: "Admin not found." };

  const ok = await bcrypt.compare(current, record.passwordHash);
  if (!ok) return { ok: false, error: "Current password is incorrect." };

  const hash = await bcrypt.hash(next, 12);
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: hash } });
  return { ok: true, message: "Password changed successfully." };
}

export async function updateAdminAvatar(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const file = formData.get("avatar") as File | null;

  if (file === null) {
    const record = await prisma.admin.findUnique({ where: { id: admin.id }, select: { avatar: true } });
    if (record?.avatar) await removeAvatarFile(record.avatar);
    await prisma.admin.update({ where: { id: admin.id }, data: { avatar: null } });
    revalidatePath("/admin");
    return { ok: true, message: "Avatar removed." };
  }

  if (!file || file.size === 0) return { ok: false, error: "No file provided." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "File must be an image." };
  if (file.size > 1_000_000) return { ok: false, error: "Image must be under 1 MB." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const record = await prisma.admin.findUnique({ where: { id: admin.id }, select: { avatar: true } });

  const filename = await saveAvatarFile(buffer, file.type, admin.id, record?.avatar);
  await prisma.admin.update({ where: { id: admin.id }, data: { avatar: filename } });

  revalidatePath("/admin");
  return { ok: true, message: "Avatar updated.", avatar: buildAvatarUrl(filename)! };
}
