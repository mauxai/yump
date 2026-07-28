import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ShellLayout } from "@/components/ShellLayout";
import { buildStorageUrl } from "@/lib/storage-url";
import { ActivityContent } from "./ActivityContent";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await auth();
  const userId  = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const q    = (searchParams.q ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const baseWhere = { project: { userId } };
  const where     = { ...baseWhere, ...(q ? { prompt: { contains: q } } : {}) };

  const [edits, total, totalEdits, projectCount, recentProjects] = await Promise.all([
    prisma.edit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.edit.count({ where }),
    prisma.edit.count({ where: baseWhere }),
    prisma.project.count({ where: { userId, edits: { some: {} } } }),
    prisma.project.findMany({
      where:   { userId, edits: { some: {} } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true, name: true,
        _count:    { select: { edits: true } },
        updatedAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ShellLayout title="Activity" titleKey="activity.title" subtitle="Every edit you've made across projects." subtitleKey="activity.subtitle">
      <ActivityContent
        edits={edits.map(e => ({
          id: e.id,
          prompt: e.prompt,
          image: e.image ? (e.image.startsWith("data:") || e.image.startsWith("http") ? e.image : buildStorageUrl(e.image)) : null,
          createdAt: new Date(e.createdAt).toISOString(),
          project: { id: e.project.id, name: e.project.name },
        }))}
        total={total}
        totalEdits={totalEdits}
        projectCount={projectCount}
        recentProjects={recentProjects.map(p => ({
          id: p.id,
          name: p.name,
          editCount: p._count.edits,
        }))}
        page={page}
        totalPages={totalPages}
        q={q}
      />
    </ShellLayout>
  );
}
