/**
 * Standalone seed runner — run with:
 *   npm run seed:prompts | seed:effects | seed:stripe | seed:twilio
 *   (or directly: tsx prisma/seeds/run.ts <name>)
 *
 * The *.seed.ts modules are export-only on purpose: they are also imported
 * by the install wizard (src/features/install/database.ts), so they must
 * never execute on import — a top-level runner there would fire during
 * `next build` page-data collection and on every dev compile.
 */
import { PrismaClient } from "@prisma/client";
import { seedPrompts } from "./prompts.seed";
import { seedEffects } from "./effects.seed";
import { seedMailTemplates } from "./mail-templates.seed";
import { seedStripeGateway } from "./gateway-stripe.seed";
import { seedTwilioGateway } from "./gateway-twilio.seed";
import { seedRazorpayGateway } from "./gateway-razorpay.seed";
import { seedAiModels } from "./ai-models.seed";

const SEEDERS: Record<string, (prisma: PrismaClient) => Promise<unknown>> = {
  prompts: seedPrompts,
  effects: seedEffects,
  "mail-templates": seedMailTemplates,
  stripe: seedStripeGateway,
  twilio: seedTwilioGateway,
  razorpay: seedRazorpayGateway,
  "ai-models": seedAiModels,
};

const name = process.argv[2];
const seeder = name ? SEEDERS[name] : undefined;
if (!seeder) {
  console.error(`Usage: tsx prisma/seeds/run.ts <${Object.keys(SEEDERS).join("|")}>`);
  process.exit(1);
}

const prisma = new PrismaClient();
seeder(prisma)
  .then((result) => {
    console.log(typeof result === "number" ? `Seeded ${result} ${name}.` : `Seeded ${name}.`);
  })
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
