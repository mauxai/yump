import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { toAbsoluteUrl } from "@/lib/utils/url";
import { deleteProject } from "@/features/projects/services/project.service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
    include: {
      edits: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    project: {
      ...project,
      originalImage: toAbsoluteUrl(project.originalImage),
      edits: project.edits.map((e) => ({ ...e, image: toAbsoluteUrl(e.image) })),
    },
  });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deleted = await deleteProject(params.id, userId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidatePath("/");
  revalidatePath(`/editor/${params.id}`);
  return NextResponse.json({ ok: true });
}
