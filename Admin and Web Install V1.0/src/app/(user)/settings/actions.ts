"use server";

import bcrypt from "bcryptjs";
import { requireUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { saveAvatarFile, removeAvatarFile } from "@/lib/avatar";
import { buildAvatarUrl } from "@/lib/storage-url";

export type ActionResult = { ok: true; message: string; avatar?: string } | { ok: false; error: string };

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (name.length > 80) return { ok: false, error: "Name must be under 80 characters." };

  await prisma.user.update({ where: { id: userId }, data: { name: name || null } });
  return { ok: true, message: "Profile updated." };
}

export async function updateEmail(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: "Invalid email address." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found." };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { ok: false, error: "Incorrect current password." };

  if (email === user.email) return { ok: false, error: "That is already your email." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { ok: false, error: "Email is already in use." };

  await prisma.user.update({ where: { id: userId }, data: { email } });
  return { ok: true, message: "Email updated. Please sign in again." };
}

export async function updateAvatar(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const file = formData.get("avatar") as File | null;

  if (file === null) {
    // Remove avatar
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } });
    if (user?.avatar) await removeAvatarFile(user.avatar);
    await prisma.user.update({ where: { id: userId }, data: { avatar: null } });
    return { ok: true, message: "Avatar removed." };
  }

  if (!file || file.size === 0) return { ok: false, error: "No file provided." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "File must be an image." };
  if (file.size > 5_000_000) return { ok: false, error: "Image must be under 5 MB." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } });

  const filename = await saveAvatarFile(buffer, file.type, userId, user?.avatar);
  await prisma.user.update({ where: { id: userId }, data: { avatar: filename } });

  return { ok: true, message: "Avatar updated.", avatar: buildAvatarUrl(filename)! };
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const current = (formData.get("current") as string | null) ?? "";
  const next = (formData.get("next") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  if (next.length < 8) return { ok: false, error: "New password must be at least 8 characters." };
  if (next !== confirm) return { ok: false, error: "Passwords do not match." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found." };

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return { ok: false, error: "Current password is incorrect." };

  const hash = await bcrypt.hash(next, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
  return { ok: true, message: "Password changed successfully." };
}
