import { prisma } from "@/lib/prisma";
import { getSettingsMap } from "@/lib/settings";
import { sendTemplateMail } from "@/lib/mailer";
import type { PaymentResult } from "./types";

async function resolvePlanName(planId: string): Promise<string> {
  const plan = await prisma.plan.findUnique({ where: { id: planId }, select: { name: true } });
  return plan?.name ?? "Unknown plan";
}

function gatewayLabel(slug: string) {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Idempotently grant credits to a user after a confirmed payment.
 * Uses gatewayRef as an idempotency key — safe to call from both
 * the success-page redirect and the webhook handler.
 * Returns true if credits were granted, false if already processed.
 */
export async function grantCreditsForPayment(
  result: PaymentResult,
  gatewaySlug: string
): Promise<boolean> {
  if (result.status !== "paid") return false;

  const existing = await prisma.billingHistory.findFirst({
    where: { gatewayRef: result.gatewayRef, status: "paid" },
  });
  if (existing) return false;

  const planName = await resolvePlanName(result.planId);

  // Step 1: add credits to user's balance and set the current plan. Storing
  // planId makes the active plan deterministic — it no longer depends on
  // racing billing_history.created_at timestamps (second-precision ties, and
  // skew against timezone-shifted seed data made stale plans "win").
  await prisma.user.update({
    where: { id: result.userId },
    data: {
      creditsTotal: { increment: result.credits },
      planId: result.planId,
    },
  });

  // Step 2: record billing history — use raw SQL so creditsGranted is always stored
  // regardless of whether the TypeScript types are up-to-date in this process.
  await prisma.$executeRawUnsafe(
    `INSERT INTO billing_history
      (id, user_id, plan_id, amount, currency, status, description, credits_granted, gateway_ref, created_at)
     VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, ?, NOW())`,
    generateCuid(),
    result.userId,
    result.planId,
    result.amount,
    result.currency,
    `${planName} plan via ${gatewayLabel(gatewaySlug)}`,
    result.credits,
    result.gatewayRef ?? null,
  );

  // Send billing confirmation email (fire-and-forget)
  try {
    const emailUser = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { email: true, name: true },
    });
    if (emailUser) {
      const s = await getSettingsMap();
      await sendTemplateMail(
        emailUser.email,
        "billing_confirmation",
        {
          brand_name: s["brand.name"] || "6amStudio",
          user_name: emailUser.name ?? emailUser.email.split("@")[0],
          user_email: emailUser.email,
          plan_name: planName,
          amount: (result.amount / 100).toFixed(2),
          currency: result.currency.toUpperCase(),
          credits: String(result.credits),
          date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        },
      );
    }
  } catch {
    // Email failure should not block the payment success response
  }

  return true;
}

/** Record a failed payment without touching credits. */
export async function recordFailedPayment(
  result: PaymentResult,
  gatewaySlug: string
): Promise<void> {
  const existing = await prisma.billingHistory.findFirst({
    where: { gatewayRef: result.gatewayRef },
  });
  if (existing) return;

  const planName = await resolvePlanName(result.planId);

  await prisma.$executeRawUnsafe(
    `INSERT INTO billing_history
      (id, user_id, plan_id, amount, currency, status, description, gateway_ref, created_at)
     VALUES (?, ?, ?, ?, ?, 'failed', ?, ?, NOW())`,
    generateCuid(),
    result.userId,
    result.planId,
    result.amount,
    result.currency,
    `${planName} plan via ${gatewayLabel(gatewaySlug)} — failed`,
    result.gatewayRef ?? null,
  );
}

// Lightweight CUID-style ID without an extra dependency
function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 12).padEnd(10, "0");
  return `c${timestamp}${random}`;
}
