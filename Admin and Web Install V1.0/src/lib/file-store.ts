import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { getStorageConfig } from "@/lib/storage";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

function extFromMime(mime: string): string {
  return MIME_TO_EXT[mime] ?? "png";
}

/**
 * Save a base64 image to configured storage (local or S3).
 * Returns a public URL that can be stored in the DB and served to clients.
 *
 * @param base64    Raw base64 string (no data: prefix)
 * @param mimeType  e.g. "image/png"
 * @param subfolder e.g. "projects/user123"
 */
export async function saveImageFile(
  base64: string,
  mimeType: string,
  subfolder: string,
): Promise<string> {
  const cfg = await getStorageConfig();
  const ext = extFromMime(mimeType);
  const filename = `${randomUUID()}.${ext}`;
  const key = `${subfolder}/${filename}`;
  const buffer = Buffer.from(base64, "base64");

  if (cfg.driver === "s3") {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: cfg.region,
      credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
      ...(cfg.endpoint ? { endpoint: cfg.endpoint, forcePathStyle: true } : {}),
    });
    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    const base = cfg.publicUrlBase
      ? cfg.publicUrlBase.replace(/\/$/, "")
      : `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
    return `${base}/${key}`;
  }

  // Local driver — save under public/storage/images/...
  const publicRoot = path.join(process.cwd(), "public");
  const localPath = path.join(publicRoot, cfg.publicPath, key);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, buffer);
  return `${cfg.publicPath}/${key}`;
}

/**
 * Read a stored image as raw Buffer + mimeType.
 * Preferred over readImageAsDataUrl — avoids double base64 conversion when
 * passing to AI providers (file → Buffer → base64 → Buffer is wasteful).
 */
export async function readImageAsBuffer(
  urlOrDataUrl: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  // Legacy: already a data URL stored in DB — parse it once.
  if (urlOrDataUrl.startsWith("data:")) {
    const match = urlOrDataUrl.match(/^data:(.+?);base64,(.*)$/);
    if (!match) throw new Error("Invalid data URL");
    return { buffer: Buffer.from(match[2], "base64"), mimeType: match[1] };
  }

  const cfg = await getStorageConfig();

  if (cfg.driver === "s3") {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: cfg.region,
      credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
      ...(cfg.endpoint ? { endpoint: cfg.endpoint, forcePathStyle: true } : {}),
    });
    const key = urlToS3Key(urlOrDataUrl, cfg.publicUrlBase, cfg.bucket, cfg.region);
    const resp = await client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of resp.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return { buffer: Buffer.concat(chunks), mimeType: resp.ContentType ?? "image/png" };
  }

  // Local driver — read file directly as Buffer (no base64 intermediate).
  const publicRoot = path.join(process.cwd(), "public");
  const relativePath = urlOrDataUrl.startsWith("/") ? urlOrDataUrl.slice(1) : urlOrDataUrl;
  const localPath = path.join(publicRoot, relativePath);
  const buffer = await fs.readFile(localPath);
  return { buffer, mimeType: mimeFromPath(localPath) };
}

/**
 * Read a stored image back as a base64 data URL (data:mime;base64,...).
 * Use readImageAsBuffer instead when passing to AI — this exists only for
 * the thumb route which needs a data URL for legacy base64 detection.
 */
export async function readImageAsDataUrl(urlOrDataUrl: string): Promise<string> {
  if (urlOrDataUrl.startsWith("data:")) return urlOrDataUrl;
  const { buffer, mimeType } = await readImageAsBuffer(urlOrDataUrl);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

/**
 * Delete a stored image file. Silently ignores missing files.
 * Does nothing for legacy data URLs.
 */
export async function deleteImageFile(urlOrDataUrl: string): Promise<void> {
  if (urlOrDataUrl.startsWith("data:")) return;

  const cfg = await getStorageConfig();

  if (cfg.driver === "s3") {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: cfg.region,
      credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
      ...(cfg.endpoint ? { endpoint: cfg.endpoint, forcePathStyle: true } : {}),
    });
    const key = urlToS3Key(urlOrDataUrl, cfg.publicUrlBase, cfg.bucket, cfg.region);
    await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key })).catch(() => {});
    return;
  }

  const publicRoot = path.join(process.cwd(), "public");
  const relativePath = urlOrDataUrl.startsWith("/") ? urlOrDataUrl.slice(1) : urlOrDataUrl;
  const localPath = path.join(publicRoot, relativePath);
  await fs.unlink(localPath).catch(() => {});
}

// ── helpers ──────────────────────────────────────────────────────────────────

function urlToS3Key(
  url: string,
  publicUrlBase: string,
  bucket: string,
  region: string,
): string {
  // Custom CDN / public base
  if (publicUrlBase) {
    const base = publicUrlBase.replace(/\/$/, "");
    if (url.startsWith(base)) return url.slice(base.length + 1);
  }
  // Default AWS URL: https://{bucket}.s3.{region}.amazonaws.com/{key}
  const defaultBase = `https://${bucket}.s3.${region}.amazonaws.com/`;
  if (url.startsWith(defaultBase)) return url.slice(defaultBase.length);
  // Fallback: treat full URL path as key
  return new URL(url).pathname.replace(/^\//, "");
}

function mimeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return map[ext] ?? "image/png";
}
