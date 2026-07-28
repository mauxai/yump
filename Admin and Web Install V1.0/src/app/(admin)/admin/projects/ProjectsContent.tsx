"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Badge } from "@/components/ui";
import { ProjectThumb } from "@/components/ProjectThumb";

type Project = {
  id: string;
  name: string;
  updatedAt: Date;
  user: { id: string; email: string; name: string | null };
  _count: { edits: number };
};

export function ProjectsContent({ projects, q }: { projects: Project[]; q: string }) {
  const { t } = useT();

  return (
    <>
      <form action="/admin/projects" method="get" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("adminProjects.searchPlaceholder")}
          className="w-full max-w-[420px] h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none px-3 focus:border-accent-line"
        />
        {q && (
          <Link
            href="/admin/projects"
            className="h-9 inline-flex items-center px-3 rounded-[6px] bg-transparent border border-line-2 text-fg-2 text-[12px] hover:bg-bg-2"
          >
            {t("adminProjects.clear")}
          </Link>
        )}
      </form>

      {projects.length === 0 ? (
        <div className="rounded-[10px] border border-line bg-bg-1 p-8 text-center text-fg-3 text-[13px]">
          {q ? t("adminProjects.noMatchQuery", { q }) : t("adminProjects.noProjectsYet")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/admin/projects/${p.id}`}
              className="group rounded-[10px] border border-line bg-bg-1 overflow-hidden hover:border-line-2 hover:-translate-y-[1px] transition-all"
            >
              <div
                className="aspect-[4/3] w-full relative overflow-hidden"
                style={{
                  background:
                    "repeating-conic-gradient(rgba(255,255,255,0.015) 0% 25%, transparent 0% 50%) 50% / 20px 20px",
                }}
              >
                <ProjectThumb projectId={p.id} name={p.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <Badge tone="muted">{p._count.edits} {t("adminProjects.edits")}</Badge>
                </div>
              </div>
              <div className="px-[14px] py-3">
                <div className="text-[13px] font-medium text-fg-0 truncate">
                  {p.name}
                </div>
                <div className="text-[11px] text-fg-3 mt-[3px] truncate">
                  {p.user.name ?? p.user.email}{" "}
                  <span className="text-fg-3">·</span>{" "}
                  <span className="mono">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
