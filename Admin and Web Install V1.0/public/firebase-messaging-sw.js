// Firebase Cloud Messaging service worker
// This file must live at /firebase-messaging-sw.js (public root)

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase event handlers (push, pushsubscriptionchange) MUST be registered
// on the initial evaluation of the worker script, so we fetch config synchronously
// via the install event and initialize Firebase before the SW activates.

let messaging = null;

function initFirebase(config) {
  if (messaging) return;
  try {
    firebase.initializeApp(config);
    messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const { title, body, image } = payload.notification ?? {};
      const data = payload.data ?? {};
      // Prefer the full image URL from data; fall back to notification.image
      const imageUrl = data.image || image || null;
      const options = {
        body:  body ?? "",
        icon:  imageUrl ?? "/favicon.ico",
        image: imageUrl ?? undefined,
        badge: "/favicon.ico",
        data,
      };
      self.registration.showNotification(title ?? "Notification", options);
    });
  } catch (e) {
    console.warn("[FCM SW] initFirebase failed:", e);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch("/api/v1/firebase/config")
      .then((r) => r.json())
      .then((config) => {
        if (config && config.enabled) {
          initFirebase(config);
        }
      })
      .catch((e) => console.warn("[FCM SW] Could not fetch config on install:", e))
  );
});

self.addEventListener("activate", (event) => {
  // If install fetch succeeded, messaging is already set.
  // Re-fetch in case config changed between installs.
  event.waitUntil(
    fetch("/api/v1/firebase/config")
      .then((r) => r.json())
      .then((config) => {
        if (config && config.enabled) {
          initFirebase(config);
        }
      })
      .catch(() => {})
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const projectId = event.notification.data?.project_id;
  if (projectId) {
    event.waitUntil(
      clients.openWindow(`/editor/${projectId}`)
    );
  }
});
