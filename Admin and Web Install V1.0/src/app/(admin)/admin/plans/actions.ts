"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { getClientIp } from "@/lib/get-ip";

export type PlanResult = { ok: true } | { ok: false; error: string };

type PlanRow = { id: string; name: string; credits: number; price: number; is_active: number; recommended: number };

function validate(fd: FormData): { name: string; credits: number; price: number } | { error: string } {
  const name = (fd.get("name") as string | null)?.trim() ?? "";
  const creditsRaw = (fd.get("credits") as string | null)?.trim() ?? "";
  const priceRaw = (fd.get("price") as string | null)?.trim() ?? "";
  const credits = parseInt(creditsRaw, 10);
  const price = parseFloat(priceRaw);

  if (!name) return { error: "Plan name is required." };
  if (!creditsRaw || isNaN(credits) || credits < 0)
    return { error: "Credits must be a non-negative number." };
  if (!priceRaw || isNaN(price) || price < 0)
    return { error: "Price must be a non-negative number." };

  return { name, credits, price };
}

export async function createPlan(fd: FormData): Promise<PlanResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = validate(fd);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const { name, credits, price } = parsed;

  const plan = await prisma.plan.create({ data: { name, credits, price } });

  await logAdminAction(admin.id, "PLAN_CREATE", {
    ip: getClientIp(),
    targetType: "plan",
    targetId: plan.id,
    after: { name, credits, price },
  });

  revalidatePath("/admin/plans");
  redirect("/admin/plans");
}

export async function updatePlan(id: string, fd: FormData): Promise<PlanResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Plan not found." };

  const parsed = validate(fd);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const { name, credits, price } = parsed;

  await prisma.plan.update({ where: { id }, data: { name, credits, price } });

  await logAdminAction(admin.id, "PLAN_UPDATE", {
    ip: getClientIp(),
    targetType: "plan",
    targetId: id,
    before: { name: existing.name, credits: existing.credits, price: existing.price },
    after: { name, credits, price },
  });

  revalidatePath("/admin/plans");
  redirect("/admin/plans");
}

export async function togglePlanActive(id: string): Promise<PlanResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const rows = await prisma.$queryRawUnsafe<PlanRow[]>(
    "SELECT id, name, is_active FROM plans WHERE id = ?", id
  );
  const existing = rows[0];
  if (!existing) return { ok: false, error: "Plan not found." };

  await prisma.$executeRawUnsafe(
    "UPDATE plans SET is_active = ? WHERE id = ?",
    existing.is_active ? 0 : 1,
    id
  );

  revalidatePath("/admin/plans");
  return { ok: true };
}

export async function toggleRecommended(id: string): Promise<PlanResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const rows = await prisma.$queryRawUnsafe<PlanRow[]>(
    "SELECT id, recommended FROM plans WHERE id = ?", id
  );
  const existing = rows[0];
  if (!existing) return { ok: false, error: "Plan not found." };

  if (existing.recommended) {
    await prisma.$executeRawUnsafe("UPDATE plans SET recommended = 0 WHERE id = ?", id);
  } else {
    await prisma.$executeRawUnsafe("UPDATE plans SET recommended = 0");
    await prisma.$executeRawUnsafe("UPDATE plans SET recommended = 1 WHERE id = ?", id);
  }

  revalidatePath("/admin/plans");
  return { ok: true };
}

export async function deletePlan(id: string): Promise<PlanResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Plan not found." };

  await prisma.plan.delete({ where: { id } });

  await logAdminAction(admin.id, "PLAN_DELETE", {
    ip: getClientIp(),
    targetType: "plan",
    targetId: id,
    before: { name: existing.name, credits: existing.credits },
  });

  revalidatePath("/admin/plans");
  return { ok: true };
}
