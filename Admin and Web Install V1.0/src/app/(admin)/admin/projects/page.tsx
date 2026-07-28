import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ProjectsContent } from "./ProjectsContent";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const q = (searchParams.q ?? "").trim();
  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { user: { email: { contains: q } } },
          { user: { name: { contains: q } } },
        ],
      }
    : {};

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      updatedAt: true,
      user: { select: { id: true, email: true, name: true } },
      _count: { select: { edits: true } },
    },
  });

  return (
    <div className="p-8 lg:p-10">
      <ProjectsContent projects={projects} q={q} />
    </div>
  );
}
