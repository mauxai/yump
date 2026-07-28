import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getCredentialFields } from "@/lib/ai-providers";
import { ModelViewContent } from "./ModelViewContent";

export const dynamic = "force-dynamic";

export default async function AdminModelViewPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const model = await prisma.aiModel.findUnique({ where: { id: params.id } });
  if (!model) notFound();

  const creds = (model.credentials as Record<string, string> | null) ?? {};
  const credFields = getCredentialFields(model.provider);
  const filledCount = credFields.filter((f) => creds[f.key]).length;
  const totalRequired = credFields.filter((f) => f.required).length;

  return (
    <ModelViewContent
        model={{
          id: model.id,
          label: model.label,
          provider: model.provider,
          modelId: model.modelId,
          credentials: creds,
          creditCost: model.creditCost,
          isActive: model.isActive,
          isDefault: model.isDefault,
          notes: model.notes ?? null,
          createdAt: model.createdAt.toISOString(),
          updatedAt: model.updatedAt.toISOString(),
        }}
        credFields={credFields}
        filledCount={filledCount}
        totalRequired={totalRequired}
      />
  );
}
