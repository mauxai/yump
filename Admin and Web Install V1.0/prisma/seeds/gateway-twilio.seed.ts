import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

export async function seedTwilioGateway(prisma: PrismaClient) {
  const existing = await prisma.gateway.findFirst({ where: { name: "twilio" } });
  if (existing) {
    console.log("  twilio    already exists — skipped");
    return;
  }

  await prisma.gateway.create({
    data: {
      id: randomUUID(),
      name: "twilio",
      type: "sms",
      mode: "live",
      credentials: {
        account_sid: "",
        auth_token: "",
      },
      config: {
        gateway_title: "Twilio",
        gateway_image: "",
        storage: "public",
        from_number: "",
      },
      isActive: false,
    },
  });

  console.log("  twilio    gateway seeded");
}
