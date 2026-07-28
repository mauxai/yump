import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export function GET(
  _req: Request,
  { params }: { params: { lang: string } },
) {
  const lang = params.lang.replace(/[^a-z\-]/gi, "").slice(0, 10);
  try {
    const filePath = join(process.cwd(), "messages", `${lang}.json`);
    const data = readFileSync(filePath, "utf-8");
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/json",
        // Cache for 1 hour in browser; translation files change only on deploy
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({}, { status: 404 });
  }
}
