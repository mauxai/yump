// Run: node scripts/test-push.mjs
// Tests FCM push delivery using credentials stored in the DB.

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const FCM_TOKEN = "d3LsZNcBQzGPxaM5AFoGFw:APA91bHe2QdGCOqc3ZtKf0VELnvFWSUFDvVteWB-tOluqhYMD9gMODy362j-pBVMgG-knulD_tVKtkU6mkZDWC2A8U79RRE3RyHC6LPjZwtgKHiboPUYCSM";

// ── load env so DATABASE_URL is available ────────────────────────────────────
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env.development" });
config({ path: ".env" });

// ── fetch Firebase credentials from DB ───────────────────────────────────────
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const rows = await prisma.$queryRaw`
  SELECT \`key\`, value FROM settings WHERE \`key\` LIKE 'firebase.%'
`;
const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
await prisma.$disconnect();

let projectId   = s["firebase.projectId"]   ?? "";
let clientEmail = s["firebase.clientEmail"]  ?? "";
let rawKey      = s["firebase.privateKey"]   ?? "";

// Support full service-account JSON in the privateKey field
// Parse BEFORE replacing \\n so the JSON structure stays valid
const trimmed = rawKey.trim();
if (trimmed.startsWith("{")) {
  const sa = JSON.parse(trimmed);
  if (sa.private_key)  rawKey      = sa.private_key;
  if (sa.client_email) clientEmail = sa.client_email;
  if (sa.project_id)   projectId   = sa.project_id;
}
const privateKey = rawKey.replace(/\\n/g, "\n");

console.log("Project ID   :", projectId);
console.log("Client Email :", clientEmail);
console.log("Private Key  : [" + privateKey.slice(0, 40) + "...]");

// ── init Firebase Admin ───────────────────────────────────────────────────────
const { initializeApp, cert } = await import("firebase-admin/app");
const { getMessaging }        = await import("firebase-admin/messaging");

const app       = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, "test");
const messaging = getMessaging(app);

// ── send test notification ────────────────────────────────────────────────────
console.log("\nSending push to token...");
try {
  const result = await messaging.send({
    token: FCM_TOKEN,
    notification: {
      title: "Test Push ✓",
      body:  "FCM delivery is working correctly.",
    },
    data: {
      projectId:   "test_project_id",
      projectName: "Test Project",
      editId:      "test_edit_id",
      image:       "https://via.placeholder.com/400x300.png",
    },
  });
  console.log("✓ Push sent successfully. Message ID:", result);
} catch (err) {
  console.error("✗ Push failed:", err.message ?? err);
}
