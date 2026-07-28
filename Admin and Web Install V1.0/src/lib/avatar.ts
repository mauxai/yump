"use server";
import fs from "fs/promises";
import path from "path";

const AVATARS_DIR = path.join(process.cwd(), "public", "storage", "avatars");

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/gif":  "gif",
  "image/webp": "webp",
};

/**
 * Saves an avatar buffer to disk, removes old file if provided.
 * Returns the new filename to store in DB.
 */
export async function saveAvatarFile(
  buffer: Buffer,
  mimeType: string,
  ownerId: string,
  oldFilename?: string | null,
): Promise<string> {
  const ext = ALLOWED_MIME[mimeType];
  if (!ext) throw new Error("Unsupported image type");

  await fs.mkdir(AVATARS_DIR, { recursive: true });

  const filename = `${ownerId}-${Date.now()}.${ext}`;
  await fs.writeFile(path.join(AVATARS_DIR, filename), buffer);

  if (oldFilename) await removeAvatarFile(oldFilename);

  return filename;
}

export async function removeAvatarFile(filename: string): Promise<void> {
  if (!filename || filename.startsWith("data:") || filename.startsWith("http")) return;
  await fs.unlink(path.join(AVATARS_DIR, filename)).catch(() => {});
}
