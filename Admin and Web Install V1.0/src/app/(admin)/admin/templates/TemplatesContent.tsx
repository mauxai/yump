"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";
import { deleteTemplate, toggleTemplateActive } from "./actions";

type TemplateRow = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  prompt: string;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
  sortOrder: number;
  usageCount: number;
  createdAt: string;
};

export function TemplatesContent({
  templates,
  total,
  totalPages,
  page,
  q,
  categoryId,
  allCategories,
}: {
  templates: TemplateRow[];
  total: number;
  totalPages: number;
  page: number;
  q: string;
  categoryId: string;
  allCategories: { id: string; name: string }[];
}) {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(q);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function nav(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  }

  function goToPage(p: number) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(p));
    router.push(`${pathname}?${sp.toString()}`);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteTemplate(id);
      if (res.ok) {
        toast.success(t("adminTemplates.toastDeleted"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setDeleteId(null);
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const res = await toggleTemplateActive(id, !current);
      if (res.ok) {
        toast.success(!current ? t("adminTemplates.toastActivated") : t("adminTemplates.toastDeactivated"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-fg-0">{t("adminTemplates.title")}</h1>
          <p className="text-[13px] text-fg-2 mt-1">{t("adminTemplates.subtitle")}</p>
        </div>
        <Link href="/admin/templates/new">
          <Button variant="primary" size="sm">
            <Icon name="plus" size={14} />
            {t("adminTemplates.newTemplate")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-bg-1 border border-line-2 min-w-[220px]">
          <Icon name="search" size={14} className="text-fg-3 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && nav({ q: search })}
            placeholder={t("adminTemplates.searchPlaceholder")}
            className="flex-1 bg-transparent text-[13px] text-fg-0 placeholder:text-fg-3 outline-none"
          />
          {search && search !== q && (
            <button
              type="button"
              onClick={() => { setSearch(""); nav({ q: "" }); }}
              className="text-fg-3 hover:text-fg-1"
            >
              <Icon name="close" size={12} />
            </button>
          )}
        </div>
        <select
          value={categoryId}
          onChange={(e) => nav({ categoryId: e.target.value })}
          className="h-9 px-3 pr-8 rounded-lg bg-bg-1 border border-line-2 text-[13px] text-fg-0 outline-none appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236a6e77' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
        >
          <option value="">{t("adminTemplates.allCategories")}</option>
          {allCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] text-fg-3">
          {total === 1 ? t("adminTemplates.statTemplates", { count: String(total) }) : t("adminTemplates.statTemplatesPlural", { count: String(total) })}
          {(q || categoryId) ? t("adminTemplates.matchingFilters") : ""}
        </p>
        {totalPages > 1 && (
          <p className="text-[12px] text-fg-3">{t("adminTemplates.pageOf", { page: String(page), total: String(totalPages) })}</p>
        )}
      </div>

      {/* Grid */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg-1 border border-line flex items-center justify-center">
            <Icon name="image" size={24} className="text-fg-3" />
          </div>
          <p className="text-[14px] font-medium text-fg-0">{t("adminTemplates.noTemplatesTitle")}</p>
          <p className="text-[13px] text-fg-2 max-w-sm">{t("adminTemplates.noTemplatesHint")}</p>
          <Link href="/admin/templates/new">
            <Button variant="primary" size="sm">
              <Icon name="plus" size={14} /> {t("adminTemplates.createFirst")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={`group rounded-xl border bg-bg-1 overflow-hidden flex flex-col transition-all hover:shadow-md ${
                tpl.isActive
                  ? "border-line hover:border-accent-line"
                  : "border-line opacity-55 hover:opacity-80"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-bg-2 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tpl.imageUrl}
                  alt={tpl.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />

                {/* Active / Inactive badge */}
                <div className="absolute top-2 left-2">
                  {tpl.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#22c55e] text-white shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />
                      {t("adminTemplates.active")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(0,0,0,0.55)] text-white/80 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      {t("adminTemplates.inactive")}
                    </span>
                  )}
                </div>

                {/* Category badge */}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 rounded-full bg-[rgba(0,0,0,0.65)] backdrop-blur-sm text-white text-[10px] font-medium capitalize shadow-sm">
                    {tpl.categoryName}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="px-3 pt-3 pb-2 flex-1 flex flex-col gap-1">
                <p className="text-[13px] font-semibold text-fg-0 truncate">{tpl.title}</p>
                <p className="text-[11px] text-fg-2 line-clamp-2 flex-1 leading-[1.5]">{tpl.prompt}</p>
                <p className="mono text-[10px] text-fg-3 mt-1">{t("adminTemplates.uses", { count: String(tpl.usageCount) })}</p>
              </div>

              {/* Actions */}
              <div className="border-t border-line px-2 py-2 flex items-center gap-1">
                <Link
                  href={`/admin/templates/${tpl.id}/edit`}
                  className="flex-1 h-7 flex items-center justify-center gap-1.5 rounded-md text-[11px] font-medium text-fg-1 hover:bg-bg-2 transition-colors"
                >
                  <Icon name="pencil" size={12} />
                  {t("adminTemplates.edit")}
                </Link>
                <div className="w-px h-4 bg-line" />
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggle(tpl.id, tpl.isActive)}
                  className="flex-1 h-7 flex items-center justify-center gap-1.5 rounded-md text-[11px] font-medium text-fg-1 hover:bg-bg-2 transition-colors disabled:opacity-50"
                >
                  <Icon name={tpl.isActive ? "eyeOff" : "eye"} size={12} />
                  {tpl.isActive ? t("adminTemplates.hide") : t("adminTemplates.show")}
                </button>
                <div className="w-px h-4 bg-line" />
                <button
                  type="button"
                  onClick={() => setDeleteId(tpl.id)}
                  className="h-7 w-8 flex items-center justify-center rounded-md text-[var(--danger)] hover:bg-[rgba(var(--danger-rgb),0.08)] transition-colors"
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {/* Prev */}
          <button
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="h-8 px-3 rounded-lg border border-line bg-bg-1 text-[12px] font-medium text-fg-1 hover:bg-bg-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <Icon name="arrowLeft" size={12} />
            {t("adminTemplates.prev")}
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === page;
              const showDot =
                totalPages > 7 &&
                p !== 1 &&
                p !== totalPages &&
                Math.abs(p - page) > 2;
              if (showDot && (p === 2 || p === totalPages - 1)) {
                return <span key={p} className="w-6 text-center text-[12px] text-fg-3">…</span>;
              }
              if (showDot) return null;
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-[var(--accent-fg)]"
                      : "bg-bg-1 border border-line text-fg-1 hover:bg-bg-2"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next */}
          <button
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            className="h-8 px-3 rounded-lg border border-line bg-bg-1 text-[12px] font-medium text-fg-1 hover:bg-bg-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {t("adminTemplates.next")}
            <Icon name="arrowRight" size={12} />
          </button>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title={t("adminTemplates.deleteTitle")}
        description={t("adminTemplates.deleteDesc")}
        confirmLabel={t("adminTemplates.deleteLabel")}
        variant="danger"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
