import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ShellLayout } from "@/components/ShellLayout";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const q        = (searchParams.q ?? "").trim();
  const page     = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const pageSize = 20;
  const skip     = (page - 1) * pageSize;

  const where = {
    userId,
    ...(q ? { name: { contains: q } } : {}),
  };

  const [projects, total] = await Promise.all([
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <ShellLayout title="Projects" titleKey="projects.title" subtitle="All your image editing projects." subtitleKey="projects.subtitle">
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <form action="/projects" method="get" className="flex items-center gap-2 flex-1">
            <div className="relative flex items-center w-full md:max-w-xs">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search projects…"
                className="w-full h-9 pl-3 pr-9 rounded-lg bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none focus:border-accent-line placeholder:text-fg-4"
              />
              <button
                type="submit"
                className="absolute right-0 h-9 w-9 flex items-center justify-center rounded-r-lg text-fg-3 hover:text-fg-0"
              >
                <Icon name="search" size={13} />
              </button>
            </div>
            {q && (
              <a href="/projects" className="h-9 px-3 flex items-center rounded-lg border border-line-2 text-fg-2 text-[12px] hover:bg-bg-2">
                Clear
              </a>
            )}
          </form>
          <Link
            href="/"
            className="h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <Icon name="plus" size={14} />
            New project
          </Link>
        </div>

        {/* Grid */}
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-bg-1 py-20 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center text-fg-3">
              <Icon name="folder" size={22} />
            </div>
            <div className="text-[14px] font-medium text-fg-0">
              {q ? "No projects match your search" : "No projects yet"}
            </div>
            <div className="text-[12px] text-fg-3 max-w-[260px]">
              {q ? "Try a different search term." : "Create your first project to start editing images with AI."}
            </div>
            {!q && (
              <Link
                href="/"
                className="mt-2 h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-accent text-[var(--accent-fg)] text-[13px] font-medium"
              >
                <Icon name="plus" size={14} />
                Create project
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/editor/${p.id}`}
                className="group rounded-2xl border border-line bg-bg-1 overflow-hidden hover:border-accent/40 hover:shadow-md transition-all"
              >
                <div className="aspect-[4/3] bg-bg-2 flex items-center justify-center border-b border-line">
                  <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center text-fg-3 group-hover:text-accent transition-colors">
                    <Icon name="image" size={22} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[13px] font-semibold text-fg-0 truncate">{p.name}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-fg-3">
                      {p._count.edits} edit{p._count.edits !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[11px] text-fg-4">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-[12px] text-fg-3">Page {page} of {totalPages} · {total} total</span>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <a
                  href={`/projects?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`}
                  className="h-8 px-3 inline-flex items-center rounded-lg border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3"
                >
                  ← Prev
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`/projects?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`}
                  className="h-8 px-3 inline-flex items-center rounded-lg border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3"
                >
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
