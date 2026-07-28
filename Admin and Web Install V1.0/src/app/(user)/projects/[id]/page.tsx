import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ShellLayout } from "@/components/ShellLayout";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      edits: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          prompt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!project || project.userId !== userId) notFound();

  return (
    <ShellLayout
      title={project.name}
      subtitle={`${project.edits.length} edit${project.edits.length !== 1 ? "s" : ""} · Created ${new Date(project.createdAt).toLocaleDateString()}`}
    >
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href={`/editor/${project.id}`}
            className="h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <Icon name="pencil" size={14} />
            Open in Editor
          </Link>
          <Link
            href="/projects"
            className="h-9 px-4 inline-flex items-center gap-2 rounded-lg border border-line-2 bg-bg-2 text-fg-1 text-[13px] hover:bg-bg-3"
          >
            ← Back to projects
          </Link>
        </div>

        {/* Original image */}
        <div>
          <h2 className="text-[13px] font-semibold text-fg-0 mb-3">Original image</h2>
          <div className="rounded-2xl border border-line bg-bg-1 overflow-hidden max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.originalImage}
              alt="Original"
              className="w-full object-contain"
            />
          </div>
        </div>

        {/* Edit history */}
        {project.edits.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-[13px] font-semibold text-fg-0">Edit history</h2>
              <span className="text-[11px] text-fg-3">{project.edits.length} edits</span>
            </div>
            <div className="space-y-2">
              {project.edits.map((edit, i) => (
                <div
                  key={edit.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-line bg-bg-1"
                >
                  <div className="w-8 h-8 rounded-full bg-bg-3 flex items-center justify-center text-[12px] font-semibold text-fg-2 shrink-0">
                    {project.edits.length - i}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-fg-0 truncate">{edit.prompt}</div>
                    <div className="text-[11px] text-fg-3 mt-0.5">
                      {new Date(edit.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {project.edits.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-bg-1 py-14 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center text-fg-3">
              <Icon name="image" size={22} />
            </div>
            <div className="text-[14px] font-medium text-fg-0">No edits yet</div>
            <div className="text-[12px] text-fg-3">Open in the editor to start making AI-powered edits.</div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
