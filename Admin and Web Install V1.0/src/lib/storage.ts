import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getSettingsByCategory } from "@/lib/settings";

export type StorageDriver = "local" | "s3";

export type LocalStorageConfig = {
  driver: "local";
  /** Path under public/, e.g. "/uploads". Files are served from there. */
  publicPath: string;
};

export type S3StorageConfig = {
  driver: "s3";
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
  /** Optional custom endpoint (R2, MinIO, DO Spaces, etc.). Empty for AWS S3. */
  endpoint: string;
  /** Optional custom public URL base (CDN or public bucket URL). */
  publicUrlBase: string;
};

export type StorageConfig = LocalStorageConfig | S3StorageConfig;

/** Read the active storage driver + its config from the DB. Cached per request. */
export async function getStorageConfig(): Promise<StorageConfig> {
  const rows = await getSettingsByCategory("storage");
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const driver: StorageDriver = s["storage.driver"] === "s3" ? "s3" : "local";

  if (driver === "s3") {
    return {
      driver: "s3",
      bucket: s["storage.s3Bucket"] ?? "",
      region: s["storage.s3Region"] ?? "us-east-1",
      accessKey: s["storage.s3AccessKey"] ?? "",
      secretKey: s["storage.s3SecretKey"] ?? "",
      endpoint: s["storage.s3Endpoint"] ?? "",
      publicUrlBase: s["storage.s3PublicUrl"] ?? "",
    };
  }

  return {
    driver: "local",
    publicPath: "/storage",
  };
}

/** True if S3 is selected and minimally configured. */
export async function isS3Ready(): Promise<boolean> {
  const cfg = await getStorageConfig();
  if (cfg.driver !== "s3") return false;
  return Boolean(cfg.bucket && cfg.accessKey && cfg.secretKey);
}

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export type PutFileResult = { filename: string };

/**
 * Validate and store an uploaded File into the given folder (e.g. "avatars").
 * Returns the stored filename so the caller can persist it to the DB.
 * Throws a plain Error with a user-facing message on validation failure.
 */
export async function putFile(
  file: File,
  folder: string,
): Promise<PutFileResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  // Postman often sends application/octet-stream — resolve from extension
  const resolvedMime =
    file.type === "application/octet-stream"
      ? (EXT_MIME[ext] ?? file.type)
      : file.type;

  if (!ALLOWED_MIME.includes(resolvedMime)) {
    throw new Error("The file must be a valid image (jpeg, png, webp, gif).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("The file may not be greater than 5 MB.");
  }

  const filename = `${randomUUID()}.${ext || "jpg"}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const cfg = await getStorageConfig();

  if (cfg.driver === "s3") {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: cfg.region,
      credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
      ...(cfg.endpoint ? { endpoint: cfg.endpoint } : {}),
    });
    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: `${folder}/${filename}`,
        Body: buffer,
        ContentType: resolvedMime,
      }),
    );
  } else {
    const dir = path.join(process.cwd(), "public", "storage", folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buffer);
  }

  return { filename };
}
