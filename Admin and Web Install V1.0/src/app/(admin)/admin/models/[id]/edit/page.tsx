import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { updateModel } from "../../actions";
import { EditModelContent } from "./EditModelContent";

export const dynamic = "force-dynamic";

export default async function EditModelPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const model = await prisma.aiModel.findUnique({ where: { id: params.id } });
  if (!model) notFound();

  const action = updateModel.bind(null, model.id);

  return (
    <EditModelContent
      modelLabel={model.label}
      initial={{
        label: model.label,
        provider: model.provider,
        modelId: model.modelId,
        credentials: (model.credentials as Record<string, string> | null) ?? {},
        notes: model.notes ?? "",
        isActive: model.isActive,
        isDefault: model.isDefault,
        creditCost: model.creditCost,
      }}
      action={action}
    />
  );
}
