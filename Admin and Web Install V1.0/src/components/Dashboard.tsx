"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, Input, Badge } from "./ui";
import { Icon } from "./Icon";
import { Sidebar } from "./Sidebar";
import { UserTopBar } from "./UserTopBar";
import { NotificationBell } from "./NotificationBell";
import { usePushSubscription } from "@/lib/use-push-subscription";
import type { LangOption } from "./LanguageSwitcher";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";
import { FadeImage } from "./FadeImage";

type Project = {
  id: string;
  name: string;
  edits: number;
  updatedAt: string;
};

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function Dashboard({
  userName,
  userEmail,
  userAvatarUrl,
  credits,
  role,
  brand,
  projects: initial,
  languages = [],
}: {
  userName: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  credits: { used: number; total: number };
  role?: "user" | "admin";
  brand: { name: string; logo: string; slogan?: string };
  projects: Project[];
  languages?: LangOption[];
}) {
  const router = useRouter();
  const { t } = useT();
  usePushSubscription();

  const [projects, setProjects] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const inputRef = useRef<HTMLInputElement>(null);

  // Refresh server data every time this page is entered (back-navigation, etc.)
  useEffect(() => { router.refresh(); }, []);

  // Sync local state whenever the server sends fresh initial data
  useEffect(() => { setProjects(initial); }, [initial]);

  const filtered = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  );

  async function onUpload(file: File) {
    setErr(null);
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", "Please pick an image file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File too large", "Image must be under 25 MB.");
      return;
    }
    setUploading(true);
    const id = toast.loading(t("dashboard.creatingProject"), "Uploading and preparing your image.");
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name.replace(/\.[^.]+$/, "") || "Untitled",
          originalImage: dataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast.resolve(id, "success", t("dashboard.projectCreated"), t("dashboard.openingEditor"));
      router.push(`/editor/${data.project.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("dashboard.uploadFailed");
      toast.resolve(id, "error", t("dashboard.uploadFailed"), msg);
      setErr(msg);
      setUploading(false);
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function onDelete(id: string) {
    setDeleteTarget(id);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const id = toast.loading(t("dashboard.deletingProject"));
    const res = await fetch(`/api/v1/projects/${deleteTarget}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((p) => p.filter((x) => x.id !== deleteTarget));
      toast.resolve(id, "success", t("dashboard.projectDeleted"));
    } else {
      toast.resolve(id, "error", t("dashboard.failedToDelete"));
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  function triggerUpload() {
    inputRef.current?.click();
  }

  return (
    <div className="h-screen flex bg-bg-0">
      <Sidebar
        user={{ name: userName, email: userEmail, avatar: userAvatarUrl }}
        credits={credits}
        role={role}
        brand={brand}
      />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <UserTopBar
          left={
            <Input
              icon="search"
              placeholder={t("projects.searchProjects")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          }
          right={
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button variant="primary" icon="plus" onClick={triggerUpload} disabled={uploading}>
                {uploading ? t("dashboard.uploading") : t("editor.newProject")}
              </Button>
            </div>
          }
          user={{ name: userName, email: userEmail, avatar: userAvatarUrl }}
          languages={languages}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />

        {/* Body */}
        <div className="flex-1 overflow-auto px-4 pb-4 pt-2 md:px-6 md:pb-6 lg:px-8 lg:pb-8">
          {err && (
            <div className="mt-4 p-3 rounded-md bg-accent-soft border border-accent-line text-[12px] text-fg-1">
              {err}
            </div>
          )}

          <HeroUpload onUpload={triggerUpload} onFile={onUpload} uploading={uploading} />

          <div className="flex items-center justify-between mt-7 mb-4">
            <div>
              <div className="text-[15px] font-semibold">{t("dashboard.recentProjects")}</div>
              <div className="text-[12px] text-fg-2 mt-[2px]">
                {filtered.length} {t("common.of")} {projects.length}
              </div>
            </div>
            <div className="flex gap-1 p-[2px] bg-bg-2 border border-line rounded-md">
              {(["grid", "list"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`w-7 h-[26px] rounded inline-flex items-center justify-center transition-colors ${
                    view === k
                      ? "bg-bg-3 text-fg-0"
                      : "bg-transparent text-fg-2 hover:text-fg-0"
                  }`}
                  aria-label={`${k} view`}
                >
                  <Icon name={k} size={14} />
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState query={query} onUpload={triggerUpload} />
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {filtered.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onOpen={() => {
                    router.refresh();
                    router.push(`/editor/${p.id}`);
                  }}
                  onDelete={() => onDelete(p.id)}
                />
              ))}
            </div>
          ) : (
            <ProjectsTable
              projects={filtered}
              onOpen={(p) => {
                router.refresh();
                router.push(`/editor/${p.id}`);
              }}
            />
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function DeleteConfirmModal({
  deleting,
  onConfirm,
  onCancel,
}: {
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !deleting) onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [deleting, onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => !deleting && onCancel()}
      />
      {/* Modal */}
      <div className="relative w-full max-w-[380px] bg-bg-0 rounded-2xl border border-line shadow-2xl" style={{ animation: "var(--anim-modal-in, _mdl 0.18s ease-out)" }}>
        {/* Icon */}
        <div className="flex flex-col items-center text-center px-8 pt-8 pb-6">
          <div className="w-12 h-12 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center mb-4">
            <Icon name="trash" size={20} className="text-[#ef4444]" />
          </div>
          <h2 className="text-[16px] font-semibold text-fg-0 tracking-tight">{t("dashboard.deleteProjectTitle")}</h2>
          <p className="text-[13px] text-fg-2 mt-2 leading-relaxed">
            {t("dashboard.deleteProjectDesc")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 h-10 rounded-[8px] border border-line-2 bg-bg-2 text-fg-1 text-[13px] font-medium hover:bg-bg-3 transition-colors disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 h-10 rounded-[8px] bg-[#ef4444] text-white text-[13px] font-medium hover:bg-[#dc2626] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                {t("common.deleting")}
              </>
            ) : (
              t("editor.deleteProject")
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function HeroUpload({
  onUpload,
  onFile,
  uploading,
}: {
  onUpload: () => void;
  onFile: (f: File) => void;
  uploading: boolean;
}) {
  const { t } = useT();
  const [drag, setDrag] = useState(false);
  return (
    <div
      onClick={onUpload}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`mt-5 rounded-xl px-4 py-6 md:px-6 md:py-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 cursor-pointer transition-colors border border-dashed ${
        drag
          ? "border-accent bg-accent-soft"
          : "border-line-2 bg-bg-1 hover:border-fg-3"
      }`}
    >
      <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-bg-2 border border-line-2 flex items-center justify-center text-accent shrink-0">
        <Icon name="upload" size={22} />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <div className="text-[15px] md:text-[17px] font-semibold tracking-tight">
          {uploading ? t("dashboard.uploading") : t("dashboard.heroTitle")}
        </div>
        <div className="text-[12px] md:text-[13px] text-fg-2 mt-1">
          {t("dashboard.heroDesc")}
        </div>
      </div>
      <Button variant="default" icon="upload">
        {t("dashboard.browseFiles")}
      </Button>
    </div>
  );
}

function EmptyState({
  query,
  onUpload,
}: {
  query: string;
  onUpload: () => void;
}) {
  const { t } = useT();
  return (
    <div
      onClick={query ? undefined : onUpload}
      className={`border border-dashed border-line-2 rounded-xl p-16 flex flex-col items-center justify-center text-center ${
        query ? "" : "cursor-pointer hover:bg-bg-1"
      } transition-colors`}
    >
      <div className="w-12 h-12 rounded-xl bg-bg-2 border border-line-2 flex items-center justify-center mb-4">
        <Icon name={query ? "search" : "image"} size={22} className="text-accent" />
      </div>
      <div className="text-[15px] font-medium mb-1">
        {query ? t("dashboard.noMatchFor", { query }) : t("projects.noProjects")}
      </div>
      <div className="text-[13px] text-fg-2 max-w-sm">
        {query ? t("dashboard.noMatchHint") : t("dashboard.noProjectsHint")}
      </div>
    </div>
  );
}

/**
 * Project thumbnail backed by the shared FadeImage (next/image with a shimmer
 * skeleton + fade-in). The /thumb endpoint is auth-gated, so FadeImage's
 * `unoptimized` strategy lets the browser fetch it directly with the cookie.
 * Both variants fill a relatively-positioned parent.
 */
function ProjectThumbnail({
  projectId,
  alt,
  variant,
}: {
  projectId: string;
  alt: string;
  variant: "card" | "row";
}) {
  return (
    <FadeImage
      src={`/api/v1/projects/${projectId}/thumb`}
      lqipSrc={`/api/v1/projects/${projectId}/thumb?lqip=1`}
      alt={alt}
      sizes={
        variant === "card"
          ? "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
          : "32px"
      }
    />
  );
}

function ProjectCard({
  project,
  onOpen,
  onDelete,
}: {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="group relative rounded-[10px] border border-line bg-bg-1 overflow-hidden cursor-pointer transition-all hover:border-line-2 hover:-translate-y-[1px]"
    >
      <div
        className="aspect-[3/2] w-full relative overflow-hidden"
        style={{
          background:
            "repeating-conic-gradient(rgba(255,255,255,0.015) 0% 25%, transparent 0% 50%) 50% / 20px 20px",
        }}
      >
        <ProjectThumbnail projectId={project.id} alt={project.name} variant="card" />
        <div className="absolute top-2 right-2">
          <Badge
            tone="muted"
            className="!bg-[rgba(10,11,13,0.65)] !text-white backdrop-blur-md !border-white/10"
          >
            <Icon name="layers" size={10} /> {project.edits}
          </Badge>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete"
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-md bg-[rgba(10,11,13,0.65)] backdrop-blur-md border border-white/10 text-white hover:text-[#f87171] flex items-center justify-center"
        >
          <Icon name="trash" size={13} />
        </button>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[12px] font-medium text-fg-0 truncate">
          {project.name}
        </div>
        <ProjectCardMeta updatedAt={project.updatedAt} edits={project.edits} />
      </div>
    </div>
  );
}

function ProjectCardMeta({ updatedAt, edits }: { updatedAt: string; edits: number }) {
  const { t } = useT();
  return (
    <div className="text-[11px] text-fg-3 mt-[2px] flex justify-between">
      <span>{formatRelative(updatedAt)}</span>
      <span className="mono">{t("dashboard.editsCount", { count: edits })}</span>
    </div>
  );
}

function ProjectsTable({
  projects,
  onOpen,
}: {
  projects: Project[];
  onOpen: (p: Project) => void;
}) {
  const { t } = useT();
  return (
    <div className="bg-bg-1 border border-line rounded-[10px] overflow-hidden">
      <div className="grid grid-cols-[44px_1fr_80px_80px] px-4 py-[8px] border-b border-line text-[11px] text-fg-2 uppercase tracking-[0.4px]">
        <div />
        <div>{t("common.name")}</div>
        <div>{t("common.edits")}</div>
        <div>{t("common.updated")}</div>
      </div>
      {projects.map((p) => (
        <button
          key={p.id}
          onClick={() => onOpen(p)}
          className="w-full grid grid-cols-[44px_1fr_80px_80px] px-4 py-[8px] border-b border-line last:border-0 items-center text-left hover:bg-bg-2 transition-colors"
        >
          <div className="relative w-8 h-6 rounded-[4px] overflow-hidden bg-bg-3 border border-line-2">
            <ProjectThumbnail projectId={p.id} alt="" variant="row" />
          </div>
          <div className="text-[12px] font-medium truncate">{p.name}</div>
          <div className="text-[11px] text-fg-2 mono">{p.edits}</div>
          <div className="text-[11px] text-fg-3">{formatRelative(p.updatedAt)}</div>
        </button>
      ))}
    </div>
  );
}
