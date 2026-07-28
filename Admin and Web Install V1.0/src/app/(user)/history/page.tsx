import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ShellLayout } from "@/components/ShellLayout";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

type ActivityType = "edit" | "project_created" | "credit_purchased";

interface ActivityItem {
  id:          string;
  type:        ActivityType;
  description: string;
  meta?:       Record<string, unknown>;
  createdAt:   Date;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { page?: string; type?: string };
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const page     = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const pageSize = 30;
  const skip     = (page - 1) * pageSize;
  const typeFilter = searchParams.type as ActivityType | undefined;

  const [edits, editCount, projects, projectCount, billing, billingCount] = await Promise.all([
    (!typeFilter || typeFilter === "edit")
      ? prisma.edit.findMany({
          where: { project: { userId } },
          orderBy: { createdAt: "desc" },
          skip: typeFilter === "edit" ? skip : 0,
          take: typeFilter === "edit" ? pageSize : 50,
          select: {
            id: true, prompt: true, createdAt: true,
            project: { select: { id: true, name: true } },
          },
        })
      : Promise.resolve([]),
    (!typeFilter || typeFilter === "edit")
      ? prisma.edit.count({ where: { project: { userId } } })
      : Promise.resolve(0),
    (!typeFilter || typeFilter === "project_created")
      ? prisma.project.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip: typeFilter === "project_created" ? skip : 0,
          take: typeFilter === "project_created" ? pageSize : 50,
          select: { id: true, name: true, createdAt: true },
        })
      : Promise.resolve([]),
    (!typeFilter || typeFilter === "project_created")
      ? prisma.project.count({ where: { userId } })
      : Promise.resolve(0),
    (!typeFilter || typeFilter === "credit_purchased")
      ? prisma.billingHistory.findMany({
          where: { userId, status: "paid" },
          orderBy: { createdAt: "desc" },
          skip: typeFilter === "credit_purchased" ? skip : 0,
          take: typeFilter === "credit_purchased" ? pageSize : 50,
          select: { id: true, description: true, creditsGranted: true, createdAt: true },
        })
      : Promise.resolve([]),
    (!typeFilter || typeFilter === "credit_purchased")
      ? prisma.billingHistory.count({ where: { userId, status: "paid" } })
      : Promise.resolve(0),
  ]);

  // Merge & sort all activity
  const items: ActivityItem[] = [
    ...edits.map((e) => ({
      id:          e.id,
      type:        "edit" as const,
      description: `Edited "${e.project.name}": ${e.prompt}`,
      meta:        { projectId: e.project.id, projectName: e.project.name },
      createdAt:   e.createdAt,
    })),
    ...projects.map((p) => ({
      id:          p.id,
      type:        "project_created" as const,
      description: `Created project "${p.name}"`,
      meta:        { projectId: p.id },
      createdAt:   p.createdAt,
    })),
    ...billing.map((b) => ({
      id:          b.id,
      type:        "credit_purchased" as const,
      description: b.description,
      meta:        { creditsGranted: b.creditsGranted },
      createdAt:   b.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(typeFilter ? 0 : skip, typeFilter ? pageSize : skip + pageSize);

  const total = typeFilter === "edit"
    ? editCount
    : typeFilter === "project_created"
      ? projectCount
      : typeFilter === "credit_purchased"
        ? billingCount
        : editCount + projectCount + billingCount;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const typeIcons = {
    edit:             "pencil",
    project_created:  "folder",
    credit_purchased: "credit",
  } as const;

  const typeColors: Record<ActivityType, string> = {
    edit:             "bg-accent/10 text-accent",
    project_created:  "bg-blue-500/10 text-blue-500",
    credit_purchased: "bg-green-500/10 text-green-500",
  };

  return (
    <ShellLayout title="Activity History" titleKey="history.title" subtitle="A log of everything you've done." subtitleKey="history.subtitle">
      <div className="space-y-5">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { value: "",                 label: "All" },
            { value: "edit",             label: "Edits" },
            { value: "project_created",  label: "Projects" },
            { value: "credit_purchased", label: "Credits" },
          ] as { value: string; label: string }[]).map(({ value, label }) => (
            <a
              key={value}
              href={value ? `/history?type=${value}` : "/history"}
              className={`h-7 px-3 inline-flex items-center rounded-full text-[11px] font-medium transition-colors ${
                (typeFilter ?? "") === value
                  ? "bg-accent text-[var(--accent-fg)]"
                  : "bg-bg-2 border border-line-2 text-fg-2 hover:bg-bg-3"
              }`}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Timeline */}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-bg-1 py-20 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center text-fg-3">
              <Icon name="history" size={22} />
            </div>
            <div className="text-[14px] font-medium text-fg-0">No activity yet</div>
            <div className="text-[12px] text-fg-3">Start editing images to build your history.</div>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-bg-1 overflow-hidden divide-y divide-line">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-bg-2 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${typeColors[item.type]}`}>
                  <Icon name={typeIcons[item.type]} size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-fg-0 line-clamp-2">{item.description}</div>
                  {item.meta?.creditsGranted != null && (
                    <div className="text-[11px] text-accent mt-0.5">
                      +{String(item.meta.creditsGranted as number)} credits
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-fg-4 shrink-0 pt-0.5">
                  {new Date(item.createdAt).toLocaleString(undefined, {
                    month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
                {typeof item.meta?.projectId === "string" && (
                  <Link
                    href={`/editor/${item.meta.projectId}`}
                    className="shrink-0 h-7 px-2 inline-flex items-center rounded-md text-[11px] text-fg-3 hover:bg-bg-3 hover:text-fg-0 transition-colors border border-line-2"
                  >
                    Open
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-fg-3">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <a href={`/history?${new URLSearchParams({ ...(typeFilter ? { type: typeFilter } : {}), page: String(page - 1) })}`} className="h-8 px-3 inline-flex items-center rounded-lg border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3">
                  ← Prev
                </a>
              )}
              {page < totalPages && (
                <a href={`/history?${new URLSearchParams({ ...(typeFilter ? { type: typeFilter } : {}), page: String(page + 1) })}`} className="h-8 px-3 inline-flex items-center rounded-lg border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3">
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
