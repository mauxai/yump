"use client";
import { useEffect } from "react";

type FirebaseConfig = {
  enabled:           boolean;
  apiKey:            string;
  authDomain:        string;
  projectId:         string;
  storageBucket:     string;
  messagingSenderId: string;
  appId:             string;
  vapidKey:          string;
};

async function getConfig(): Promise<FirebaseConfig | null> {
  try {
    const res = await fetch("/api/v1/firebase/config");
    const data: FirebaseConfig = await res.json();
    return data.enabled ? data : null;
  } catch {
    return null;
  }
}

async function registerToken(token: string): Promise<string | null> {
  try {
    const res  = await fetch("/api/v1/push/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token }),
    });
    const data = await res.json();
    return data.topic ?? null;
  } catch {
    return null;
  }
}

export function usePushSubscription() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      console.log("[Push] Not supported in this browser.");
      return;
    }

    (async () => {
      // 1. Fetch Firebase config from server
      const config = await getConfig();
      if (!config) {
        console.log("[Push] Firebase is not configured or disabled.");
        return;
      }

      // 2. Check current permission
      const permission = Notification.permission;
      if (permission === "denied") {
        console.log("[Push] Subscription status: BLOCKED (user denied permission)");
        return;
      }

      // 3. Request permission if not yet granted
      let granted = permission === "granted";
      if (!granted) {
        const result = await Notification.requestPermission();
        granted = result === "granted";
      }

      if (!granted) {
        console.log("[Push] Subscription status: NOT SUBSCRIBED (permission not granted)");
        return;
      }

      // 4. Initialise Firebase app (lazy import avoids SSR issues)
      const { initializeApp, getApps, getApp } = await import("firebase/app");
      const { getMessaging, getToken, isSupported } = await import("firebase/messaging");

      const supported = await isSupported();
      if (!supported) {
        console.log("[Push] Firebase Messaging is not supported in this browser.");
        return;
      }

      const app = getApps().length
        ? getApp()
        : initializeApp({
            apiKey:            config.apiKey,
            authDomain:        config.authDomain,
            projectId:         config.projectId,
            storageBucket:     config.storageBucket,
            messagingSenderId: config.messagingSenderId,
            appId:             config.appId,
          });

      const messaging = getMessaging(app);

      // Register the FCM service worker, then wait until it is fully active.
      // getToken() needs an active SW; calling it before activation causes
      // "no active Service Worker" / PushManager subscribe failures.
      await navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .catch(() => null);

      // navigator.serviceWorker.ready resolves only once a SW is active for this page.
      const activeReg = await navigator.serviceWorker.ready;

      // 5. Get FCM token
      let token: string | null = null;
      try {
        token = await getToken(messaging, {
          vapidKey:                  config.vapidKey,
          serviceWorkerRegistration: activeReg,
        });
      } catch (err) {
        console.warn("[Push] Could not get FCM token:", err);
      }

      if (!token) {
        console.log("[Push] Subscription status: NOT SUBSCRIBED (could not obtain FCM token)");
        return;
      }

      // 6. Subscribe to panel topic via server
      const topic = await registerToken(token);

      console.log("[Push] Subscription status: SUBSCRIBED ✓");
      console.log(`[Push] Subscribed to topic: ${topic ?? "(unknown)"}`);
    })();
  }, []);
}
