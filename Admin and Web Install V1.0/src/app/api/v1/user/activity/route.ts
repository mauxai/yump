import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { unauthorized, handleApiError } from "@/lib/utils/error-handler";
import { buildStorageUrl } from "@/lib/storage-url";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE     = 100;

export async function GET(req: Request) {
  try {
    const userId = await requireUserId(req);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const q        = (searchParams.get("q") ?? "").trim();
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10)));
    const skip     = (page - 1) * pageSize;

    const baseWhere = { project: { userId } };
    const where     = q ? { ...baseWhere, prompt: { contains: q } } : baseWhere;

    const [edits, total, totalEdits, projectsEdited, activeProjects] = await Promise.all([
      prisma.edit.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take:    pageSize,
        skip,
        select: {
          id:          true,
          prompt:      true,
          image:       true,
          createdAt:   true,
          aiModelId:   true,
          creditCost:  true,
          aiModel:     { select: { label: true, provider: true } },
          project:     { select: { id: true, name: true } },
        },
      }),
      prisma.edit.count({ where }),
      prisma.edit.count({ where: baseWhere }),
      prisma.project.count({ where: { userId, edits: { some: {} } } }),
      prisma.project.findMany({
        where:   { userId, edits: { some: {} } },
        orderBy: { updatedAt: "desc" },
        take:    5,
        select: {
          id:        true,
          name:      true,
          updatedAt: true,
          _count:    { select: { edits: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const formattedEdits = edits.map((e) => ({
      id:        e.id,
      prompt:    e.prompt,
      image:     e.image
        ? (e.image.startsWith("data:") || e.image.startsWith("http")
            ? e.image
            : buildStorageUrl(e.image))
        : null,
      createdAt: e.createdAt,
      project: {
        id:   e.project.id,
        name: e.project.name,
      },
      model:      e.aiModelId ? { id: e.aiModelId, label: e.aiModel?.label ?? null } : null,
      creditCost: e.creditCost,
    }));

    return NextResponse.json({
      stats: {
        totalEdits,
        projectsEdited,
        pageCount: edits.length,
      },
      edits: formattedEdits,
      activeProjects: activeProjects.map((p) => ({
        id:        p.id,
        name:      p.name,
        edit_count: p._count.edits,
        updatedAt: p.updatedAt,
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
