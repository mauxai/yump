import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clearSessionAndRedirect } from "@/lib/clear-session";
import { getSettingsMap } from "@/lib/settings";
import { Editor } from "@/components/Editor";
import { getModelLabel } from "@/lib/ai-providers";
import { getSetting } from "@/lib/settings";
import { getActiveLanguages } from "@/lib/get-active-languages";

export const dynamic = "force-dynamic";

export default async function EditorPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const [user, project, settings, activeModels, rawPrompts, rawEffects, languages, rawTemplates] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.project.findFirst({
      where: { id: params.id, userId },
      include: { edits: { orderBy: { createdAt: "asc" } } },
    }),
    getSettingsMap(),
    prisma.aiModel.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      select: { id: true, provider: true, modelId: true, label: true, isDefault: true, creditCost: true },
    }),
    getSetting("editor.suggestedPrompts", "[]"),
    prisma.effectPreset.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, label: true, icon: true, prompt: true, category: true, categoryColor: true },
    }),
    getActiveLanguages(),
    prisma.template.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, title: true, imageUrl: true, prompt: true, category: { select: { name: true } } },
    }),
  ]);

  let suggestedPrompts: string[] = [];
  try {
    const parsed = JSON.parse(rawPrompts);
    if (Array.isArray(parsed)) suggestedPrompts = parsed.filter((s: unknown) => typeof s === "string" && s.trim());
  } catch { /* leave empty */ }

  if (!user) clearSessionAndRedirect("/login");
  if (!project) notFound();

  const models = activeModels.map((m: typeof activeModels[0]) => ({
    id: m.id,
    label: m.label || getModelLabel(m.provider, m.modelId),
    isDefault: m.isDefault,
    creditCost: m.creditCost,
    provider: m.provider,
  }));

  // Group effects by category preserving sortOrder
  const effectMap = new Map<string, { title: string; color: string; effects: typeof rawEffects }>();
  for (const p of rawEffects) {
    if (!effectMap.has(p.category)) {
      effectMap.set(p.category, { title: p.category, color: p.categoryColor, effects: [] });
    }
    effectMap.get(p.category)!.effects.push(p);
  }
  const effectCategories = Array.from(effectMap.values());

  return (
    <Editor
      userName={user.name ?? user.email.split("@")[0]}
      initialCredits={{ used: user.creditsUsed, total: user.creditsTotal }}
      models={models}
      brand={{
        name: settings["brand.name"] ?? "6amStudio",
        logo: settings["brand.logo"] ?? "",
      }}
      sketchColor={settings["editor.sketchColor"] ?? "#00e676"}
      suggestedPrompts={suggestedPrompts}
      effectCategories={effectCategories}
      templates={rawTemplates.map((t) => ({
        id: t.id,
        title: t.title,
        imageUrl: t.imageUrl,
        prompt: t.prompt,
        category: t.category?.name ?? "",
      }))}
      languages={languages}
      project={{
        id: project.id,
        name: project.name,
        originalImage: project.originalImage,
        edits: project.edits.map((e: typeof project.edits[0]) => ({
          id: e.id,
          parentId: e.parentId,
          prompt: e.prompt,
          image: e.image,
          createdAt: e.createdAt.toISOString(),
        })),
      }}
    />
  );
}
