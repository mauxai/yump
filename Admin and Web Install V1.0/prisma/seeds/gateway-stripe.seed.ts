import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

export async function seedStripeGateway(prisma: PrismaClient) {
  const existing = await prisma.gateway.findFirst({ where: { name: "stripe" } });
  if (existing) {
    console.log("  stripe    already exists — skipped");
    return;
  }

  await prisma.gateway.create({
    data: {
      id: randomUUID(),
      name: "stripe",
      type: "payment",
      mode: "live",
      credentials: {
        publishable_key: "",
        secret_key: "",
        webhook_secret: "",
      },
      config: {
        gateway_title: "Stripe",
        gateway_image: "",
        storage: "public",
        currency: "usd",
        webhook_url: "",
      },
      isActive: false,
    },
  });

  console.log("  stripe    gateway seeded");
}
