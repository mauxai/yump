import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildDatabaseUrl,
  testConnection,
  countExistingTables,
  wipeDatabase,
  pushSchema,
  seedSystemData,
  adoptDatabaseUrl,
} from "@/features/install/database";
import { getInstallState, markStepCompleted } from "@/features/install/status";
import { STEP } from "@/features/install/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  host: z.string().min(1).max(191),
  port: z.coerce.number().int().min(1).max(65535).default(3306),
  database: z.string().min(1).max(191),
  username: z.string().min(1).max(191),
  password: z.string().max(191).default(""),
  // Set by the wizard only after the user confirmed the existing-data
  // warning: erase everything in the target database before installing.
  confirmWipe: z.boolean().default(false),
});

/**
 * Step 2 — database.
 * Test credentials → create/sync schema → seed system data → persist
 * DATABASE_URL (env files + running process) → record progress in DB.
 */
export async function POST(req: NextRequest) {
  const state = await getInstallState();
  if (state.installed) {
    return NextResponse.json({ error: "Already installed." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const url = buildDatabaseUrl(parsed.data);

  const test = await testConnection(url);
  // A missing database is fine — `db push` creates it. Anything else
  // (bad credentials, unreachable host) bounces back to the form.
  if (!test.ok && !test.missingDatabase) {
    return NextResponse.json({ error: test.message }, { status: 422 });
  }

  // Existing data is never touched silently: surface a warning and let the
  // buyer choose between erasing this database or picking another one.
  if (test.ok) {
    const tableCount = await countExistingTables(url, parsed.data.database).catch(() => 0);
    if (tableCount > 0 && !parsed.data.confirmWipe) {
      return NextResponse.json(
        {
          requiresWipeConfirmation: true,
          tableCount,
          error: `Database "${parsed.data.database}" already contains ${tableCount} table(s).`,
        },
        { status: 409 },
      );
    }
    if (tableCount > 0 && parsed.data.confirmWipe) {
      try {
        await wipeDatabase(url, parsed.data.database);
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Could not erase the database." },
          { status: 500 },
        );
      }
    }
  }

  try {
    await pushSchema(url);
    await seedSystemData(url);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database setup failed." },
      { status: 500 },
    );
  }

  const envFiles = adoptDatabaseUrl(url);
  await markStepCompleted(STEP.database);

  return NextResponse.json({ ok: true, envFiles });
}
