import { prisma } from "@/lib/prisma";
import type { ProjectSummary, ProjectDetail, CreateProjectInput } from "../types";
import { saveImageFile, deleteImageFile } from "@/lib/file-store";

export async function listProjects(
  userId: string,
  opts: { page?: number; pageSize?: number; q?: string } = {},
): Promise<{ projects: ProjectSummary[]; total: number }> {
  const page     = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 20;
  const skip     = (page - 1) * pageSize;

  const where = {
    userId,
    ...(opts.q ? { name: { contains: opts.q } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id:        true,
        name:      true,
        createdAt: true,
        updatedAt: true,
        _count:    { select: { edits: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects: rows.map((p) => ({
      id:        p.id,
      name:      p.name,
      editCount: p._count.edits,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    total,
  };
}

export async function getProjectById(
  projectId: string,
  userId: string,
): Promise<ProjectDetail | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      edits: {
        orderBy: { createdAt: "desc" },
        select: {
          id:        true,
          prompt:    true,
          image:     true,
          parentId:  true,
          createdAt: true,
        },
      },
    },
  });
  if (!project) return null;

  return {
    id:            project.id,
    name:          project.name,
    editCount:     project.edits.length,
    originalImage: project.originalImage,
    createdAt:     project.createdAt.toISOString(),
    updatedAt:     project.updatedAt.toISOString(),
    edits:         project.edits.map((e) => ({
      id:        e.id,
      prompt:    e.prompt,
      image:     e.image,
      parentId:  e.parentId,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<{ id: string; name: string }> {
  // If caller passes a raw base64 data URL, save it to file storage first.
  let originalImage = input.originalImage;
  if (originalImage.startsWith("data:")) {
    const match = originalImage.match(/^data:(.+?);base64,(.*)$/);
    if (match) {
      originalImage = await saveImageFile(match[2], match[1], `projects/${userId}`);
    }
  }

  return prisma.project.create({
    data: {
      userId,
      name:          input.name,
      originalImage,
    },
    select: { id: true, name: true },
  });
}

export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: { edits: { select: { image: true } } },
  });
  if (!project) return false;

  await prisma.project.delete({ where: { id: projectId } });

  // Clean up all stored files (no-op for legacy base64 values or missing files)
  await Promise.all([
    deleteImageFile(project.originalImage),
    ...project.edits.map((e) => deleteImageFile(e.image)),
  ]);

  return true;
}
