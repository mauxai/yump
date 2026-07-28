import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ProjectDetailContent } from "./ProjectDetailContent";

export const dynamic = "force-dynamic";

export default async function AdminProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { id: true, email: true, name: true },
      },
      edits: {
        select: { id: true, prompt: true, createdAt: true, parentId: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) notFound();

  return (
    <div className="p-8 lg:p-10">
      <ProjectDetailContent project={project} />
    </div>
  );
}
