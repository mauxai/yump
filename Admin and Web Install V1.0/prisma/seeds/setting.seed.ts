import type { PrismaClient } from "@prisma/client";

type SeedSetting = { key: string; value: string; category: string };

const DEFAULTS: SeedSetting[] = [
  // Branding
  { key: "brand.name", value: "6amStudio", category: "branding" },
  { key: "brand.slogan", value: "AI-powered photo editing", category: "branding" },
  { key: "brand.logo", value: "", category: "branding" },
  { key: "brand.favicon", value: "", category: "branding" },

  // General workspace settings
  { key: "general.country", value: "US", category: "general" },
  { key: "general.timezone", value: "UTC", category: "general" },
  { key: "general.currency", value: "USD", category: "general" },
  { key: "general.dateFormat", value: "MM/DD/YYYY", category: "general" },

  // Storage — "local" (public/uploads) or "s3" (any S3-compatible)
  { key: "storage.driver", value: "local", category: "storage" },
  { key: "storage.localPath", value: "/uploads", category: "storage" },
  { key: "storage.s3Bucket", value: "", category: "storage" },
  { key: "storage.s3Region", value: "us-east-1", category: "storage" },
  { key: "storage.s3AccessKey", value: "", category: "storage" },
  { key: "storage.s3SecretKey", value: "", category: "storage" },
  { key: "storage.s3Endpoint", value: "", category: "storage" },
  { key: "storage.s3PublicUrl", value: "", category: "storage" },
];

export async function seedSettings(prisma: PrismaClient) {
  // skipDuplicates keeps re-runs (and the install wizard over an existing
  // database) from failing on the unique key — existing values are kept.
  await prisma.setting.createMany({ data: DEFAULTS, skipDuplicates: true });
  return DEFAULTS.length;
}
