import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Env templates ship with an empty AUTH_SECRET — each deployment generates
// its own value here, once, at server boot (this file is evaluated after the
// env files are loaded but before anything is compiled or served, in dev,
// build and start alike). Running before the env watcher exists means it can
// never trigger the reload/recompile loop a request-time write would. An
// operator-provided secret is respected and left untouched.
function ensureAuthSecret() {
  if (process.env.AUTH_SECRET) return;
  const secret = crypto.randomBytes(32).toString("base64");
  const line = `AUTH_SECRET="${secret}"`;
  const root = process.cwd();
  const files = [".env", ".env.development", ".env.production"]
    .map((name) => path.join(root, name))
    .filter((file) => fs.existsSync(file));
  if (files.length === 0) files.push(path.join(root, ".env"));
  for (const file of files) {
    const body = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    // Key already present (even empty) → set only the value, in place.
    // Key missing → append key + value.
    const next = /^AUTH_SECRET=.*$/m.test(body)
      ? body.replace(/^AUTH_SECRET=.*$/m, line)
      : `${body.replace(/\n*$/, "\n")}${line}\n`;
    fs.writeFileSync(file, next);
  }
  process.env.AUTH_SECRET = secret;
}
ensureAuthSecret();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "15mb" },
  },

  // Allow the browser canvas (crossOrigin="anonymous") to load stored images
  // for compositing operations (lasso, brush, heal, crop tools).
  async headers() {
    return [
      {
        source: "/storage/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
