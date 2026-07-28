"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { DeleteProjectButton } from "@/components/admin/ProjectActions";
import { ProjectThumb } from "@/components/ProjectThumb";

type Edit = { id: string; prompt: string; createdAt: Date; parentId: string | null };
type User = { id: string; email: string; name: string | null };
type Project = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  edits: Edit[];
};

export function ProjectDetailContent({ project }: { project: Project }) {
  const { t } = useT();

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/projects"
          className="text-[12px] text-fg-2 hover:text-fg-0 inline-flex items-center gap-1"
        >
          <Icon name="arrowLeft" size={12} /> {t("adminProjects.backToProjects")}
        </Link>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-semibold text-fg-0 tracking-tight">{project.name}</h1>
            <div className="text-[13px] text-fg-2 mt-0.5">
              {t("adminProjects.ownedBy", { owner: project.user.name ?? project.user.email })}
            </div>
          </div>
          <Badge tone="muted">{project.edits.length} {t("adminProjects.edits")}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div
            className="rounded-[10px] border border-line bg-bg-1 overflow-hidden"
            style={{
              background:
                "repeating-conic-gradient(rgba(255,255,255,0.015) 0% 25%, transparent 0% 50%) 50% / 20px 20px",
            }}
          >
            <div className="aspect-[4/3] relative">
              <ProjectThumb projectId={project.id} name={project.name} className="absolute inset-0 w-full h-full object-contain" />
            </div>
          </div>

          <Section title={t("adminProjects.editHistoryTitle", { count: String(project.edits.length) })}>
            {project.edits.length === 0 ? (
              <div className="text-[12px] text-fg-3">
                {t("adminProjects.noEditsYet")}
              </div>
            ) : (
              <div className="divide-y divide-line">
                {project.edits.map((e, i) => (
                  <div key={e.id} className="py-2 flex items-center gap-3">
                    <div className="mono text-[11px] text-fg-3 w-8">
                      v{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-fg-0 truncate">
                        {e.prompt}
                      </div>
                      <div className="text-[11px] text-fg-3 mono">
                        {new Date(e.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title={t("adminProjects.detailsSection")}>
            <KV k={t("adminProjects.kvName")} v={project.name} />
            <KV k={t("adminProjects.kvOwner")} v={project.user.name ?? project.user.email} />
            <KV k={t("adminProjects.kvOwnerEmail")} v={project.user.email} mono />
            <KV k={t("adminProjects.kvCreated")} v={project.createdAt.toLocaleString()} />
            <KV k={t("adminProjects.kvUpdated")} v={project.updatedAt.toLocaleString()} />
          </Section>
          <Section title={t("adminProjects.ownerSection")}>
            <Link
              href={`/admin/users/${project.user.id}`}
              className="inline-flex items-center gap-2 text-[12px] text-accent hover:underline"
            >
              <Icon name="arrowRight" size={12} /> {t("adminProjects.viewOwnerProfile")}
            </Link>
          </Section>
          <div
            className="rounded-lg border p-5"
            style={{
              background: "var(--bg-1)",
              borderColor: "oklch(0.68 0.18 25 / 0.35)",
            }}
          >
            <div
              className="text-[11px] uppercase tracking-[0.6px] mb-2 mono"
              style={{ color: "var(--danger)" }}
            >
              {t("adminProjects.dangerZone")}
            </div>
            <div className="text-[12px] text-fg-2 mb-3">
              {t("adminProjects.dangerDesc", { count: String(project.edits.length) })}
            </div>
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-bg-1 p-5">
      <div className="text-[11px] text-fg-2 uppercase tracking-[0.6px] mb-3 mono">
        {title}
      </div>
      {children}
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-[5px] text-[12px] border-b border-dashed border-line last:border-0">
      <span className="text-fg-2">{k}</span>
      <span className={`text-fg-0 text-right ${mono ? "mono" : ""}`}>{v}</span>
    </div>
  );
}
