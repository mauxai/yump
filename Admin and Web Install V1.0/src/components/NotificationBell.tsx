"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

type Notif = {
  id:        string;
  title:     string;
  body:      string;
  data:      Record<string, string> | null;
  isRead:    boolean;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const [open,       setOpen]       = useState(false);
  const [items,      setItems]      = useState<Notif[]>([]);
  const [unread,     setUnread]     = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  // Poll unread count every 30s
  const fetchCount = useCallback(async () => {
    try {
      const res  = await fetch("/api/v1/notifications?limit=1");
      const data = await res.json();
      setUnread(data.unreadCount ?? 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  async function fetchNotifications(nextPage?: number) {
    setLoading(true);
    try {
      const p    = nextPage ?? 1;
      const url  = `/api/v1/notifications?limit=20&page=${p}`;
      const res  = await fetch(url);
      const data = await res.json();
      setItems((prev) => p > 1 ? [...prev, ...data.notifications] : data.notifications);
      setUnread(data.unreadCount ?? 0);
      setPage(p);
      setTotalPages(data.totalPages ?? 1);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    await fetch("/api/v1/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  async function markOneRead(id: string) {
    await fetch("/api/v1/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function deleteOne(id: string) {
    const wasUnread = items.find((n) => n.id === id)?.isRead === false;
    await fetch(`/api/v1/notifications/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnread((c) => Math.max(0, c - 1));
  }

  function toggle() {
    if (!open) {
      setOpen(true);
      fetchNotifications();
    } else {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-[8px] text-fg-2 hover:text-fg-0 hover:bg-bg-2 transition-colors"
      >
        <Icon name="bell" size={16} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-[3px] rounded-full bg-accent text-[var(--accent-fg,#fff)] text-[9px] font-bold flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute end-0 top-[calc(100%+6px)] z-50 w-[340px] sm:w-[380px] bg-bg-1 border border-line-2 rounded-[12px] shadow-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-fg-0">Notifications</span>
              {unread > 0 && (
                <span className="inline-flex items-center h-5 px-2 rounded-full bg-accent/10 text-accent text-[10px] font-semibold">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] text-accent hover:underline px-1"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[380px]">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-[12px] text-fg-3">
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-fg-3">
                <Icon name="bell" size={28} className="opacity-20" />
                <span className="text-[12px]">No notifications yet</span>
              </div>
            ) : (
              <>
                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b border-line last:border-b-0 hover:bg-bg-2 transition-colors group ${n.isRead ? "opacity-70" : ""}`}
                  >
                    {/* Dot */}
                    <div className="mt-1 shrink-0">
                      <span className={`block w-2 h-2 rounded-full ${n.isRead ? "bg-transparent" : "bg-accent"}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-fg-0 leading-snug">{n.title}</div>
                      <div className="text-[11px] text-fg-3 mt-0.5 leading-snug">{n.body}</div>
                      {n.data?.project_id && (
                        <a
                          href={`/editor/${n.data.project_id}`}
                          className="inline-flex items-center gap-1 mt-1 text-[10px] text-accent hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open project
                          <Icon name="arrowRight" size={9} />
                        </a>
                      )}
                      <div className="text-[10px] text-fg-4 mt-1">{timeAgo(n.createdAt)}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!n.isRead && (
                        <button
                          type="button"
                          title="Mark read"
                          onClick={() => markOneRead(n.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-bg-3 text-fg-3 hover:text-fg-1 transition-colors"
                        >
                          <Icon name="bolt" size={11} />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Dismiss"
                        onClick={() => deleteOne(n.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-bg-3 text-fg-3 hover:text-fg-1 transition-colors"
                      >
                        <Icon name="close" size={11} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Load more */}
                {page < totalPages && (
                  <button
                    type="button"
                    onClick={() => fetchNotifications(page + 1)}
                    disabled={loading}
                    className="w-full py-2.5 text-[11px] text-fg-3 hover:text-fg-1 hover:bg-bg-2 transition-colors"
                  >
                    {loading ? "Loading…" : "Load more"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
