"use client";
import { useState, useMemo } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useT } from "@/lib/i18n";

const PAGE_SIZE = 10;

type Notif = {
  id: string; title: string; body: string;
  data: Record<string, string> | null; isRead: boolean; createdAt: string;
};

function useTimeAgo() {
  const { t } = useT();
  return function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60)  return t("notifications.justNow");
    const m = Math.floor(s / 60);
    if (m < 60)  return t(m === 1 ? "notifications.minutesAgo" : "notifications.minutesPluralAgo", { count: m });
    const h = Math.floor(m / 60);
    if (h < 24)  return t(h === 1 ? "notifications.hoursAgo" : "notifications.hoursPluralAgo", { count: h });
    const d = Math.floor(h / 24);
    if (d < 7)   return t(d === 1 ? "notifications.daysAgo" : "notifications.daysPluralAgo", { count: d });
    return new Date(dateStr).toLocaleDateString();
  };
}

export function NotificationsContent({
  initial,
  initialUnread,
}: {
  initial:       Notif[];
  initialUnread: number;
}) {
  const { t }  = useT();
  const timeAgo = useTimeAgo();

  const [items, setItems]   = useState(initial);
  const [unread, setUnread] = useState(initialUnread);
  const [busy, setBusy]     = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);

  const [confirmId, setConfirmId] = useState<string | null>(null);

  // ── Filtered + paginated ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        (n.data?.project_name ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged       = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async function markAll() {
    setBusy(true);
    await fetch("/api/v1/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setItems((p) => p.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    setBusy(false);
  }

  async function markOne(id: string) {
    await fetch("/api/v1/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems((p) => p.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function dismissOne(id: string) {
    const wasUnread = items.find((n) => n.id === id)?.isRead === false;
    await fetch(`/api/v1/notifications/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((n) => n.id !== id));
    if (wasUnread) setUnread((c) => Math.max(0, c - 1));
    setConfirmId(null);
    const remaining = filtered.length - 1;
    if (remaining > 0 && currentPage > Math.ceil(remaining / PAGE_SIZE)) {
      setPage((p) => Math.max(1, p - 1));
    }
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-fg-0">{t("notifications.title")}</h1>
          {unread > 0 && (
            <p className="text-[12px] text-fg-3 mt-0.5">{t("notifications.unread", { count: unread })}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Button variant="ghost" onClick={markAll} disabled={busy}>
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      {items.length > 0 && (
        <div className="relative mb-4">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4 pointer-events-none" />
          <input
            type="text"
            placeholder={t("notifications.searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-line bg-bg-1 text-[13px] text-fg-0 placeholder:text-fg-4 focus:outline-none focus:ring-2 focus:ring-accent/40 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-4 hover:text-fg-1 transition-colors"
            >
              <Icon name="close" size={12} />
            </button>
          )}
        </div>
      )}

      {/* ── List ── */}
      {paged.length === 0 ? (
        <div className="rounded-xl border border-line bg-bg-1 flex flex-col items-center justify-center py-16 gap-3 text-fg-3">
          <div className="w-12 h-12 rounded-full bg-bg-2 flex items-center justify-center">
            <Icon name="bell" size={22} className="opacity-30" />
          </div>
          <div className="text-[13px]">
            {search ? t("notifications.noSearchResults") : t("notifications.noNotifications")}
          </div>
          {!search && (
            <div className="text-[11px] text-fg-4">{t("notifications.noNotificationsHint")}</div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-bg-1 divide-y divide-line overflow-hidden">
          {paged.map((n) => (
            <div
              key={n.id}
              className={`flex gap-4 px-5 py-4 hover:bg-bg-2 transition-colors ${n.isRead ? "" : "bg-accent/[0.03]"}`}
            >
              {/* Unread dot */}
              <div className="mt-1.5 shrink-0">
                <span className={`block w-2 h-2 rounded-full transition-colors ${n.isRead ? "bg-transparent" : "bg-accent"}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] leading-snug ${n.isRead ? "text-fg-1 font-medium" : "text-fg-0 font-semibold"}`}>
                  {n.title}
                </div>
                <div className="text-[12px] text-fg-3 mt-0.5 leading-snug">{n.body}</div>
                {n.data?.project_id && (
                  <a
                    href={`/editor/${n.data.project_id}`}
                    className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-accent hover:underline"
                  >
                    {t("notifications.openProject")}
                    <Icon name="arrowRight" size={10} />
                  </a>
                )}
                <div className="text-[10px] text-fg-4 mt-1.5">{timeAgo(n.createdAt)}</div>
              </div>

              {/* Actions — always visible */}
              <div className="flex items-center gap-1 shrink-0 self-start mt-1">
                {!n.isRead && (
                  <button
                    type="button"
                    title={t("notifications.markAsRead")}
                    onClick={() => markOne(n.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-3 text-fg-3 hover:text-fg-0 transition-colors"
                  >
                    <Icon name="bolt" size={13} />
                  </button>
                )}
                <button
                  type="button"
                  title={t("notifications.deleteNotification")}
                  onClick={() => setConfirmId(n.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-fg-3 hover:text-red-500 transition-colors"
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-[12px] text-fg-4">
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} {t("notifications.of")} {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-line bg-bg-1 text-fg-2 hover:bg-bg-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="arrowLeft" size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border text-[12px] font-medium transition-colors ${
                  p === currentPage
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-bg-1 text-fg-2 hover:bg-bg-2"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-line bg-bg-1 text-fg-2 hover:bg-bg-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="arrowRight" size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm delete one ── */}
      <ConfirmDialog
        open={confirmId !== null}
        title={t("notifications.deleteConfirmTitle")}
        description={t("notifications.deleteConfirmDesc")}
        confirmLabel={t("notifications.deleteNotification")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        icon="trash"
        onConfirm={() => confirmId && dismissOne(confirmId)}
        onCancel={() => setConfirmId(null)}
      />

    </div>
  );
}
