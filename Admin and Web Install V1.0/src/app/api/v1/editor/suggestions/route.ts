import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SETTING_KEY = "editor.suggestedPrompts";

/** GET /api/v1/editor/suggestions
 *  Returns the prompt suggestion chips configured in the admin settings.
 *  Returns an empty array if none are configured.
 */
export async function GET() {
  const row = await prisma.setting.findFirst({ where: { key: SETTING_KEY } });

  let suggestions: string[] = [];
  if (row?.value) {
    try {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed)) {
        suggestions = parsed.filter((s): s is string => typeof s === "string" && s.trim() !== "");
      }
    } catch {
      // malformed value — return empty
    }
  }

  return NextResponse.json({ suggestions });
}
