import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payment/registry";
import { buildStorageUrl } from "@/lib/storage-url";
import { getSystemCurrency } from "@/lib/currency";

export const dynamic = "force-dynamic";

/** Returns active payment gateways with only their public config (no secrets). */
export async function GET() {
  const systemCurrency = await getSystemCurrency();
  const rows = await prisma.gateway.findMany({
    where: { type: "payment", isActive: true },
    select: { id: true, name: true, credentials: true, config: true },
  });

  const gateways = rows
    .map((row) => {
      const impl = getPaymentGateway(row.name);
      if (!impl) return null;
      const credentials = (row.credentials ?? {}) as Record<string, string>;
      const config      = (row.config ?? {})      as Record<string, string>;
      const effectiveConfig = {
        currency: systemCurrency.code,
        ...config,
      };
      return {
        id:     row.id,
        slug:   row.name,
        title:  config.gateway_title ?? row.name,
        logo:   config.gateway_image ? buildStorageUrl(`/storage/${config.gateway_image}`) : null,
        public: impl.publicConfig(credentials, effectiveConfig),
      };
    })
    .filter(Boolean);

  return NextResponse.json({ gateways });
}
