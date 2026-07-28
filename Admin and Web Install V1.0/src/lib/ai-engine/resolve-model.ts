import { prisma } from "@/lib/prisma";

export type ResolvedModel = {
  id: string;
  provider: string;
  modelId: string;
  credentials: Record<string, string>;
};

/**
 * Loads the active AI model configuration from the database.
 * Prefers the model marked as default; falls back to any active model.
 * Throws a clear error if nothing is configured.
 */
export async function resolveActiveModel(): Promise<ResolvedModel> {
  const model = await prisma.aiModel.findFirst({
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  if (!model) {
    throw new Error(
      "No active AI model configured. Add one at Admin → AI Models.",
    );
  }

  return {
    id: model.id,
    provider: model.provider,
    modelId: model.modelId,
    credentials: (model.credentials as Record<string, string> | null) ?? {},
  };
}

/**
 * Loads a specific model by its DB id.
 */
export async function resolveModelById(id: string): Promise<ResolvedModel> {
  const model = await prisma.aiModel.findUnique({ where: { id } });

  if (!model) throw new Error(`AI model "${id}" not found.`);
  if (!model.isActive) throw new Error(`AI model "${model.label}" is inactive.`);

  return {
    id: model.id,
    provider: model.provider,
    modelId: model.modelId,
    credentials: (model.credentials as Record<string, string> | null) ?? {},
  };
}
