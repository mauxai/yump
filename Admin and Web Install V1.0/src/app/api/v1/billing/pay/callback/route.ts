import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/v1/billing/pay/callback?data=<base64_json>
 *  Landing endpoint after payment redirect.
 *  Mobile WebViews intercept this URL and decode `data` from base64.
 *  Browser clients receive the decoded JSON directly.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("data");

  if (!raw) {
    return NextResponse.json({ error: "Missing data parameter." }, { status: 400 });
  }

  try {
    const json = Buffer.from(decodeURIComponent(raw), "base64").toString("utf-8");
    const payload = JSON.parse(json);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Invalid data encoding." }, { status: 400 });
  }
}
