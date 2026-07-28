/**
 * Installation seed — run with:
 *   npm run seed
 *
 * Seeds all data required for the system to run:
 *   admin, user, settings, prompts, effects, gateways
 *
 * Safe to re-run — all seeders use upsert / skip-if-exists.
 * Does NOT wipe existing data.
 */
import { PrismaClient } from "@prisma/client";
import { seedAdmins } from "./admin.seed";
import { seedUsers } from "./user.seed";
import { seedSettings } from "./setting.seed";
import { seedPrompts } from "./prompts.seed";
import { seedEffects } from "./effects.seed";
import { seedStripeGateway } from "./gateway-stripe.seed";
// import { seedTwilioGateway } from "./gateway-twilio.seed";
import { seedMailTemplates } from "./mail-templates.seed";
import { seedAiModels } from "./ai-models.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Installation Seed");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Admin account
  const admin = await seedAdmins(prisma);
  console.log(`✓ admin       ${admin.email} / ${admin.password}`);

  // Demo user account
  const user = await seedUsers(prisma);
  console.log(`✓ user        ${user.email} / ${user.password}`);

  // System settings
  const settingsCount = await seedSettings(prisma);
  console.log(`✓ settings    ${settingsCount} defaults`);

  // Editor suggested prompts
  const promptsCount = await seedPrompts(prisma);
  console.log(`✓ prompts     ${promptsCount} suggested prompts`);

  // Effect presets
  const effectsCount = await seedEffects(prisma);
  console.log(`✓ effects     ${effectsCount} presets across 5 categories`);

  // Payment & notification gateways
  await seedStripeGateway(prisma);
  // await seedTwilioGateway(prisma);
  console.log(`✓ gateways    stripe`);

  // Mail templates
  const mailTemplatesCount = await seedMailTemplates(prisma);
  console.log(`✓ mail templates  ${mailTemplatesCount} defaults (forgot_password, billing_confirmation, welcome)`);

  // Default AI models (fake credentials — admin replaces before use)
  const aiModelsCount = await seedAiModels(prisma);
  console.log(`✓ ai models   ${aiModelsCount} defaults (Gemini 3 Pro Image, GPT Image 2)`);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Done. System is ready to use.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
