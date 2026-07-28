import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

/**
 * Seeds a Razorpay gateway row with empty credentials.
 * Safe to re-run — skipped if a record already exists.
 *
 * Fill in credentials via the Admin → Payment Gateways UI:
 *   key_id        — from Razorpay Dashboard > API Keys
 *   key_secret    — from Razorpay Dashboard > API Keys
 *   webhook_secret — from Razorpay Dashboard > Webhooks (optional but recommended)
 *
 * Webhook URL to configure in Razorpay Dashboard:
 *   https://<your-domain>/api/v1/billing/webhook/razorpay
 *   Events: payment_link.paid
 */
export async function seedRazorpayGateway(prisma: PrismaClient) {
  const existing = await prisma.gateway.findFirst({ where: { name: "razorpay" } });
  if (existing) {
    console.log("  razorpay  already exists — skipped");
    return;
  }

  await prisma.gateway.create({
    data: {
      id: randomUUID(),
      name: "razorpay",
      type: "payment",
      mode: "live",
      credentials: {
        key_id:         "",
        key_secret:     "",
        webhook_secret: "",
      },
      config: {
        gateway_title: "Razorpay",
        gateway_image: "",
        storage:       "public",
        currency:      "INR",
        webhook_url:   "",
      },
      isActive: false,
    },
  });

  console.log("  razorpay  gateway seeded");
}
