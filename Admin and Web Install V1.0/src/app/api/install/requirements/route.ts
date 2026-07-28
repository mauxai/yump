import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { MIN_NODE_MAJOR } from "@/features/install/config";
import { getInstallState } from "@/features/install/status";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

function writable(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/** Step 1 — server requirements. */
export async function GET(_req: NextRequest) {
  const root = process.cwd();
  const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
  const prismaCli = fs.existsSync(path.join(root, "node_modules", "prisma", "build", "index.js"));
  const storageDir = path.join(root, "public", "storage");

  let sharpOk = true;
  try {
    await import("sharp");
  } catch {
    sharpOk = false;
  }

  const checks: Check[] = [
    {
      label: `Node.js ${MIN_NODE_MAJOR}+`,
      ok: nodeMajor >= MIN_NODE_MAJOR,
      detail: `running ${process.versions.node}`,
    },
    {
      label: "Project directory writable",
      ok: writable(root),
      detail: "needed to store database credentials in the env file",
    },
    {
      label: "public/storage writable",
      ok: fs.existsSync(storageDir) ? writable(storageDir) : writable(path.join(root, "public")),
      detail: "generated images are saved here",
    },
    {
      label: "Prisma CLI available",
      ok: prismaCli,
      detail: prismaCli ? "node_modules/prisma" : "run `npm install` including dev dependencies",
    },
    {
      label: "sharp image library",
      ok: sharpOk,
      detail: sharpOk ? "loaded" : "reinstall dependencies on this platform",
    },
  ];

  const state = await getInstallState();
  return NextResponse.json({
    ok: checks.every((c) => c.ok),
    checks,
    state,
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
  });
}
