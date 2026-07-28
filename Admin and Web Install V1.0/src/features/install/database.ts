import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { PrismaClient } from "@prisma/client";
import { writeEnvKey } from "./env-writer";
import { resetPrismaClient } from "@/lib/prisma";
import { seedSettings } from "../../../prisma/seeds/setting.seed";
import { seedPrompts } from "../../../prisma/seeds/prompts.seed";
import { seedEffects } from "../../../prisma/seeds/effects.seed";
import { seedStripeGateway } from "../../../prisma/seeds/gateway-stripe.seed";
import { seedMailTemplates } from "../../../prisma/seeds/mail-templates.seed";
import { seedAiModels } from "../../../prisma/seeds/ai-models.seed";

export interface DbCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export function buildDatabaseUrl(c: DbCredentials): string {
  const user = encodeURIComponent(c.username);
  const pass = encodeURIComponent(c.password);
  return `mysql://${user}${pass ? `:${pass}` : ":"}@${c.host}:${c.port}/${c.database}`;
}

/** Test the given credentials — connect and run SELECT 1. */
export async function testConnection(url: string): Promise<{
  ok: boolean;
  message: string;
  /** Credentials are valid but the named database doesn't exist yet — `db push` will create it. */
  missingDatabase: boolean;
}> {
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    await client.$queryRaw`SELECT 1`;
    return { ok: true, message: "Connection successful.", missingDatabase: false };
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const missingDatabase = /does not exist|unknown database/i.test(raw);
    // Prisma error messages are multi-line walls; surface the useful line.
    const line =
      raw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .find((l) => /denied|refused|unknown|does not exist|can't|cannot|timed?\s?out/i.test(l)) ??
      "Could not connect with the given credentials.";
    return { ok: false, message: line, missingDatabase };
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

/** Number of tables already present in the target database (0 = pristine). */
export async function countExistingTables(
  url: string,
  database: string,
): Promise<number> {
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    const rows = await client.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt
      FROM information_schema.tables
      WHERE table_schema = ${database} AND table_type = 'BASE TABLE'`;
    return Number(rows[0]?.cnt ?? 0);
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

/**
 * Drop every table in the target database — the "clean install over an
 * existing database" path. Only ever called after the buyer explicitly
 * confirmed the wipe warning in the wizard.
 */
export async function wipeDatabase(url: string, database: string): Promise<void> {
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    const rows = await client.$queryRaw<{ TABLE_NAME: string }[]>`
      SELECT TABLE_NAME
      FROM information_schema.tables
      WHERE table_schema = ${database} AND table_type = 'BASE TABLE'`;
    await client.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS=0");
    try {
      for (const r of rows) {
        const table = r.TABLE_NAME.replace(/`/g, "``");
        await client.$executeRawUnsafe(`DROP TABLE IF EXISTS \`${table}\``);
      }
    } finally {
      await client.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS=1");
    }
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

/**
 * Create/sync the schema — non-destructive: `prisma db push` creates the
 * database if missing and syncs tables without dropping existing data, so
 * re-running the wizard over a live database cannot wipe it.
 *
 * Runs the prisma CLI from node_modules in a child process (the engine
 * binary cannot run inside the Next.js bundle).
 */
export async function pushSchema(url: string): Promise<void> {
  const cli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  if (!fs.existsSync(cli)) {
    throw new Error(
      "prisma CLI not found in node_modules — run `npm install` (with dev dependencies) on the server.",
    );
  }
  await new Promise<void>((resolve, reject) => {
    execFile(
      process.execPath,
      [cli, "db", "push", "--skip-generate"],
      {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: url },
        timeout: 5 * 60 * 1000,
      },
      (error, _stdout, stderr) => {
        if (error) reject(new Error(`Schema push failed: ${stderr || error.message}`));
        else resolve();
      },
    );
  });
}

/**
 * Seed required system data (settings, prompts, effects, gateways, mail
 * templates) — the installer counterpart of `yarn db:seed`, minus the
 * accounts: the wizard's final step creates the real super admin, and
 * buyers register their own user accounts after installation.
 */
export async function seedSystemData(url: string): Promise<void> {
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    await seedSettings(client);
    await seedPrompts(client);
    await seedEffects(client);
    await seedStripeGateway(client);
    await seedMailTemplates(client);
    await seedAiModels(client);
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

/**
 * Persist the working DATABASE_URL: env files for future boots, plus
 * process.env + a Prisma client reset so the running process switches over
 * immediately (Node loads env once at boot — without this the wizard would
 * need a mid-flow restart).
 */
export function adoptDatabaseUrl(url: string): string[] {
  const files = writeEnvKey("DATABASE_URL", url);
  process.env.DATABASE_URL = url;
  resetPrismaClient();
  return files;
}
