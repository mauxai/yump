import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { deleteImageFile } from "@/lib/file-store";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { edits: { select: { image: true } } },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.delete({ where: { id: params.id } });

  await Promise.all([
    deleteImageFile(project.originalImage),
    ...project.edits.map((e) => deleteImageFile(e.image)),
  ]);

  revalidatePath("/admin/projects");

  return NextResponse.json({ ok: true });
}
