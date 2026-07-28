import type { PrismaClient } from "@prisma/client";

/**
 * Default AI models — seeded on install so the editor has something to run
 * against out of the box. Credentials are fake placeholders: the admin must
 * replace them with real API keys at Admin → AI Models before generation
 * will actually work.
 *
 * GPT Image 2 is the recommended default (isDefault), so resolveActiveModel()
 * picks it first.
 */
const DEFAULT_MODELS = [
  {
    label: "Gemini 3 Pro Image",
    provider: "google",
    modelId: "gemini-3-pro-image-preview",
    credentials: { apiKey: "AIza-fake-replace-me" },
    isActive: true,
    isDefault: false,
  },
  {
    label: "GPT Image 2 (Recommended)",
    provider: "openai",
    modelId: "gpt-image-2",
    credentials: { apiKey: "sk-fake-replace-me" },
    isActive: true,
    isDefault: true,
  },
] as const;

export async function seedAiModels(prisma: PrismaClient): Promise<number> {
  let created = 0;

  for (const m of DEFAULT_MODELS) {
    const existing = await prisma.aiModel.findFirst({
      where: { provider: m.provider, modelId: m.modelId },
    });
    if (existing) {
      console.log(`  ${m.label} already exists — skipped`);
      continue;
    }

    await prisma.aiModel.create({
      data: {
        label: m.label,
        provider: m.provider,
        modelId: m.modelId,
        credentials: m.credentials,
        isActive: m.isActive,
        isDefault: m.isDefault,
      },
    });
    created += 1;
  }

  return created;
}
