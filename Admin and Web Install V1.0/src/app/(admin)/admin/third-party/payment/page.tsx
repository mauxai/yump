import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PaymentContent } from "./PaymentContent";

export const dynamic = "force-dynamic";

type GatewayRow = {
  id: string; name: string; type: string; mode: string;
  isActive: boolean; createdAt: Date;
  credentials: unknown; config: unknown;
};

export default async function PaymentGatewayPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const q = (searchParams.q ?? "").trim();
  const typeFilter = (searchParams.type ?? "").trim();

  const where = {
    AND: [
      q ? { OR: [{ name: { contains: q } }] } : {},
      typeFilter ? { type: typeFilter } : {},
    ],
  };

  const [total, gateways] = await Promise.all([
    prisma.gateway.count(),
    prisma.gateway.findMany({ where, orderBy: { createdAt: "desc" } }),
  ]);

  const activeCount = (gateways as GatewayRow[]).filter((g) => g.isActive).length;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1100px] mx-auto">
      <PaymentContent
        gateways={gateways as GatewayRow[]}
        total={total}
        activeCount={activeCount}
        q={q}
        typeFilter={typeFilter}
      />
    </div>
  );
}
