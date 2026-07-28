/**
 * Gateway seeders — run with:
 *   npm run seed:gateways
 *
 * Adds Stripe and Twilio gateway records with empty credentials.
 * Safe to re-run — existing records are skipped.
 */
import { PrismaClient } from "@prisma/client";
import { seedStripeGateway } from "./gateway-stripe.seed";
import { seedRazorpayGateway } from "./gateway-razorpay.seed";
// import { seedTwilioGateway } from "./gateway-twilio.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding gateways…");
  await seedStripeGateway(prisma);
  await seedRazorpayGateway(prisma);
  // await seedTwilioGateway(prisma);
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
