import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { GatewayForm } from "../../GatewayForm";

export const dynamic = "force-dynamic";

export default async function EditGatewayPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const gw = await prisma.gateway.findUnique({ where: { id: params.id } });
  if (!gw) notFound();

  return (
    <GatewayForm
      initial={{
        id: gw.id,
        name: gw.name,
        type: gw.type,
        mode: gw.mode,
        credentials: (gw.credentials as Record<string, string> | null) ?? {},
        config: (gw.config as Record<string, string> | null) ?? {},
      }}
    />
  );
}
