import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AuditDetailContent } from "./AuditDetailContent";

export const dynamic = "force-dynamic";

export default async function AdminAuditDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const row = await prisma.adminAudit.findUnique({ where: { id: params.id } });
  if (!row) notFound();

  const actor = await prisma.admin.findUnique({
    where: { id: row.actorAdminId },
    select: { id: true, email: true, name: true },
  });

  return (
    <AuditDetailContent
      data={{
        id: row.id,
        action: row.action,
        createdAt: row.createdAt.toISOString(),
        ip: row.ip,
        actorAdminId: row.actorAdminId,
        targetType: row.targetType,
        targetId: row.targetId,
        before: row.before as Record<string, unknown> | null,
        after:  row.after  as Record<string, unknown> | null,
        meta:   row.meta   as Record<string, unknown> | null,
        actor,
      }}
    />
  );
}
