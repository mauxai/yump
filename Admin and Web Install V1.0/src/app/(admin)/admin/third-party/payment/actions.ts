"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { getClientIp } from "@/lib/get-ip";

export type GatewayResult = { ok: true } | { ok: false; error: string };

const REVALIDATE = "/admin/third-party/payment";

function parseJSON(raw: string | null): Record<string, string> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function createGateway(fd: FormData): Promise<GatewayResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const name = (fd.get("name") as string | null)?.trim() ?? "";
  const type = (fd.get("type") as string | null)?.trim() ?? "";
  const mode = (fd.get("mode") as string | null)?.trim() ?? "live";

  if (!name) return { ok: false, error: "Gateway name is required." };
  if (!["payment", "sms"].includes(type)) return { ok: false, error: "Invalid type." };

  const credentials = parseJSON(fd.get("credentials") as string | null);
  const config = parseJSON(fd.get("config") as string | null);

  if (!config?.gateway_title) return { ok: false, error: "Gateway title is required." };

  const gw = await prisma.gateway.create({
    data: { name, type, mode, credentials: credentials ?? undefined, config: config ?? undefined, isActive: false },
  });

  await logAdminAction(admin.id, "GATEWAY_CREATE", {
    ip: getClientIp(),
    targetType: "gateway",
    targetId: gw.id,
    after: { name, type, mode },
  });

  revalidatePath(REVALIDATE);
  redirect(REVALIDATE);
}

export async function updateGateway(id: string, fd: FormData): Promise<GatewayResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const existing = await prisma.gateway.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Gateway not found." };

  const mode = (fd.get("mode") as string | null)?.trim() ?? "live";

  const newCredentials = parseJSON(fd.get("credentials") as string | null);
  const newConfig = parseJSON(fd.get("config") as string | null);

  if (!newConfig?.gateway_title) return { ok: false, error: "Gateway title is required." };

  // Merge credentials: keep existing values for blank fields (password masking UX)
  const existingCreds = (existing.credentials as Record<string, string> | null) ?? {};
  const mergedCreds: Record<string, string> = { ...existingCreds };
  if (newCredentials) {
    for (const [k, v] of Object.entries(newCredentials)) {
      if (v !== "" && v !== null) mergedCreds[k] = v;
      else if (!(k in mergedCreds)) mergedCreds[k] = "";
    }
  }

  await prisma.gateway.update({
    where: { id },
    data: { mode, credentials: mergedCreds, config: newConfig },
  });

  await logAdminAction(admin.id, "GATEWAY_UPDATE", {
    ip: getClientIp(),
    targetType: "gateway",
    targetId: id,
    before: { name: existing.name, mode: existing.mode },
    after: { name: existing.name, mode },
  });

  revalidatePath(REVALIDATE);
  redirect(REVALIDATE);
}

export async function deleteGateway(id: string): Promise<GatewayResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const existing = await prisma.gateway.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Gateway not found." };

  await prisma.gateway.delete({ where: { id } });

  await logAdminAction(admin.id, "GATEWAY_DELETE", {
    ip: getClientIp(),
    targetType: "gateway",
    targetId: id,
    before: { name: existing.name, type: existing.type },
  });

  revalidatePath(REVALIDATE);
  return { ok: true };
}

export async function toggleGatewayActive(id: string, isActive: boolean): Promise<GatewayResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  await prisma.gateway.update({ where: { id }, data: { isActive } });
  revalidatePath(REVALIDATE);
  return { ok: true };
}
