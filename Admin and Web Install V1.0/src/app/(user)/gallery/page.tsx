import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ShellLayout } from "@/components/ShellLayout";
import { Icon } from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: { page?: string; project?: string };
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const page     = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const pageSize = 24;
  const skip     = (page - 1) * pageSize;
  const projectFilter = searchParams.project;

  const projects = await prisma.project.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { updatedAt: "desc" },
  });

  const editWhere = {
    project: {
      userId,
      ...(projectFilter ? { id: projectFilter } : {}),
    },
  };

  const [edits, total] = await Promise.all([
    prisma.edit.findMany({
      where: editWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id:        true,
        prompt:    true,
        image:     true,
        createdAt: true,
        project:   { select: { id: true, name: true } },
      },
    }),
    prisma.edit.count({ where: editWhere }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    if (projectFilter) params.set("project", projectFilter);
    params.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    return `/gallery?${params.toString()}`;
  }

  return (
    <ShellLayout title="Gallery" titleKey="gallery.title" subtitle="All your AI-generated and edited images." subtitleKey="gallery.subtitle">
      <div className="space-y-5">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/gallery"
            className={`h-7 px-3 inline-flex items-center rounded-full text-[11px] font-medium transition-colors ${
              !projectFilter ? "bg-accent text-[var(--accent-fg)]" : "bg-bg-2 border border-line-2 text-fg-2 hover:bg-bg-3"
            }`}
          >
            All projects
          </a>
          {projects.map((p) => (
            <a
              key={p.id}
              href={buildUrl({ project: p.id, page: "1" })}
              className={`h-7 px-3 inline-flex items-center rounded-full text-[11px] font-medium transition-colors ${
                projectFilter === p.id ? "bg-accent text-[var(--accent-fg)]" : "bg-bg-2 border border-line-2 text-fg-2 hover:bg-bg-3"
              }`}
            >
              {p.name}
            </a>
          ))}
        </div>

        {/* Grid */}
        {edits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-bg-1 py-20 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center text-fg-3">
              <Icon name="image" size={22} />
            </div>
            <div className="text-[14px] font-medium text-fg-0">No images yet</div>
            <div className="text-[12px] text-fg-3 max-w-[260px]">
              Start editing projects to build your gallery.
            </div>
            <Link
              href="/"
              className="mt-2 h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-accent text-[var(--accent-fg)] text-[13px] font-medium"
            >
              <Icon name="plus" size={14} />
              Create project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {edits.map((edit) => (
              <Link
                key={edit.id}
                href={`/editor/${edit.project.id}`}
                className="group rounded-xl border border-line bg-bg-1 overflow-hidden hover:border-accent/40 hover:shadow-md transition-all"
              >
                <div className="aspect-square bg-bg-2 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={edit.image}
                    alt={edit.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2">
                  <div className="text-[11px] text-fg-3 truncate">{edit.project.name}</div>
                  <div className="text-[10px] text-fg-4 mt-0.5">
                    {new Date(edit.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-[12px] text-fg-3">
              Page {page} of {totalPages} · {total} images
            </span>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <a href={buildUrl({ page: String(page - 1) })} className="h-8 px-3 inline-flex items-center rounded-lg border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3">
                  ← Prev
                </a>
              )}
              {page < totalPages && (
                <a href={buildUrl({ page: String(page + 1) })} className="h-8 px-3 inline-flex items-center rounded-lg border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3">
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
