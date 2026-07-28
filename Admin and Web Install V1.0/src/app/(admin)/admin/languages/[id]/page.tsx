import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TranslationEditor } from "./TranslationEditor";
import { loadTranslations } from "./actions";

export const dynamic = "force-dynamic";

export default async function LanguageTranslationsPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const lang = await prisma.language.findUnique({ where: { id: params.id } });
  if (!lang) notFound();

  const data = await loadTranslations(params.id);
  if (!data.ok) notFound();

  return (
    <TranslationEditor
      langId={params.id}
      langName={data.langName!}
      langCode={data.langCode!}
      nativeName={data.nativeName!}
      base={data.base!}
      initialTranslations={data.translations!}
    />
  );
}
