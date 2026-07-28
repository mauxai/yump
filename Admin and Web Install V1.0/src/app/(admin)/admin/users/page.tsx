import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { UsersContent } from "./UsersContent";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const q = (searchParams.q ?? "").trim();
  const where = q
    ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      status: true,
      lastActiveAt: true,
      creditsUsed: true,
      creditsTotal: true,
      createdAt: true,
      _count: { select: { projects: true } },
    },
  });

  return <UsersContent users={users} q={q} />;
}
