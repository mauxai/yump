import { z } from "zod";

export const emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(120, "Name too long");

export const promptSchema = z
  .string()
  .min(1, "Prompt is required")
  .max(2000, "Prompt too long");

export const paginationSchema = z.object({
  page:     z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  q:        z.string().optional(),
});

export const idSchema = z.string().cuid("Invalid ID");

export function isValidImageDataUrl(value: string): boolean {
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(value);
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
