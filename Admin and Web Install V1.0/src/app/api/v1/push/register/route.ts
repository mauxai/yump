import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth-helpers";
import { getSetting } from "@/lib/settings";
import { subscribeToUserTopic, unsubscribeFromUserTopic, panelTopic } from "@/lib/firebase-push";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(10).max(4096),
});

// Web panel calls this to subscribe its FCM token to the user's topic.
// The token is NOT stored — topic-based delivery covers all panel tabs/devices.
export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const topic = panelTopic(userId);

  if ((await getSetting("firebase.enabled", "false")) === "true") {
    try {
      await subscribeToUserTopic(parsed.data.token, userId);
    } catch (err) {
      // Log the real Firebase error for debugging but don't fail the request
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Push] subscribeToTopic failed:", msg);
    }
  }

  return NextResponse.json({ ok: true, topic });
}

// Call on logout / permission revoked to unsubscribe the browser from the topic.
export async function DELETE(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const token = body?.token as string | undefined;
  if (!token) return NextResponse.json({ error: "token is required" }, { status: 400 });

  if ((await getSetting("firebase.enabled", "false")) === "true") {
    await unsubscribeFromUserTopic(token, userId);
  }

  return NextResponse.json({ ok: true });
}
