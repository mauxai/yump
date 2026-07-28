import { getSettingsMap } from "@/lib/settings";

type App = import("firebase-admin/app").App;

let cachedApp: App | null = null;
let cachedKey = "";

async function getMessaging() {
  const { initializeApp, getApps, deleteApp, cert } = await import("firebase-admin/app");
  const { getMessaging } = await import("firebase-admin/messaging");

  const s = await getSettingsMap();
  let projectId   = s["firebase.projectId"]   ?? "";
  let clientEmail = s["firebase.clientEmail"]  ?? "";
  let rawKey      = s["firebase.privateKey"]   ?? "";

  // If the privateKey field contains a full service-account JSON, extract fields from it.
  // Parse BEFORE replacing \\n so the JSON remains valid.
  const trimmed = rawKey.trim();
  if (trimmed.startsWith("{")) {
    try {
      const sa = JSON.parse(trimmed) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (sa.private_key)  rawKey      = sa.private_key;
      if (sa.client_email) clientEmail = sa.client_email;
      if (sa.project_id)   projectId   = sa.project_id;
    } catch {
      throw new Error("firebase.privateKey contains invalid JSON. Paste either the raw private key or the full service account JSON.");
    }
  }

  // Normalise escaped newlines after JSON parsing
  const privateKey = rawKey.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase is not configured. Set projectId, clientEmail, and privateKey in Admin → 3rd Party → Firebase.");
  }

  const key = `${projectId}|${clientEmail}|${privateKey.slice(-20)}`;
  if (cachedApp && cachedKey === key) return getMessaging(cachedApp);

  if (cachedApp) {
    await deleteApp(cachedApp).catch(() => {});
    cachedApp = null;
  }

  const existing = getApps().find((a) => a.name === "push");
  if (existing) await deleteApp(existing).catch(() => {});

  cachedApp = initializeApp(
    { credential: cert({ projectId, clientEmail, privateKey }) },
    "push",
  );
  cachedKey = key;
  return getMessaging(cachedApp);
}

export type PushPayload = {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
};

// Topic name for a user's web-panel browser subscriptions.
// Must match [a-zA-Z0-9-_.~%] — replace anything else with '_'.
export function panelTopic(userId: string): string {
  return "panel_user_" + userId.replace(/[^a-zA-Z0-9\-_.~%]/g, "_");
}

// Subscribe / unsubscribe a web-panel browser FCM token to the user's topic.
export async function subscribeToUserTopic(token: string, userId: string): Promise<void> {
  const messaging = await getMessaging();
  await messaging.subscribeToTopic([token], panelTopic(userId));
}

export async function unsubscribeFromUserTopic(token: string, userId: string): Promise<void> {
  const messaging = await getMessaging();
  await messaging.unsubscribeFromTopic([token], panelTopic(userId));
}

// Send directly to a single FCM token (used for mobile app).
export async function sendPushNotification(
  token: string,
  payload: PushPayload,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const messaging = await getMessaging();
    await messaging.send({
      token,
      notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
      data: payload.data,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Send to multiple tokens (legacy — kept for compatibility).
export async function sendPushToMany(
  tokens: string[],
  payload: PushPayload,
): Promise<{ successCount: number; failureCount: number }> {
  if (!tokens.length) return { successCount: 0, failureCount: 0 };
  const messaging = await getMessaging();
  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
    data: payload.data,
  });
  return { successCount: res.successCount, failureCount: res.failureCount };
}

// Send to an FCM topic (used for web-panel subscriptions).
export async function sendPushToTopic(
  topic: string,
  payload: PushPayload,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const messaging = await getMessaging();
    await messaging.send({
      topic,
      notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
      data: payload.data,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
