"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { useT } from "@/lib/i18n";
import { adminSearch, type SearchGroups, type SearchHit } from "@/app/(admin)/search-actions";

const EMPTY: SearchGroups = { pages: [], users: [], projects: [], admins: [] };

export function AdminSearchButton() {
  const [open, setOpen] = useState(false);
  const { t } = useT();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 w-full max-w-[520px] px-3 rounded-[8px] border border-line-2 bg-bg-1 hover:bg-bg-2 transition-colors text-left"
      >
        <Icon name="search" size={14} className="text-fg-2 shrink-0" />
        <span className="flex-1 text-[13px] text-fg-2 truncate whitespace-nowrap">
          <span className="hidden sm:inline">{t("adminSearch.placeholder")}</span>
          <span className="sm:hidden">{t("adminSearch.placeholderShort")}</span>
        </span>
        <kbd className="hidden md:inline-flex items-center h-5 px-1.5 rounded text-[10px] font-mono text-fg-3 border border-line-2 bg-bg-2">
          ⌘K
        </kbd>
      </button>
      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroups>(EMPTY);
  const [activeIdx, setActiveIdx] = useState(0);
  const [pending, startTransition] = useTransition();
  const { t, lang } = useT();

  const flat = [...groups.pages, ...groups.users, ...groups.projects, ...groups.admins];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGroups(EMPTY);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        setGroups(await adminSearch(q, lang));
        setActiveIdx(0);
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function hrefFor(h: SearchHit): string {
    if (h.type === "user")    return `/admin/users/${h.id}`;
    if (h.type === "project") return `/admin/projects/${h.id}`;
    if (h.type === "page")    return h.href;
    if (h.type === "admin")   return `/admin/users?q=${encodeURIComponent(h.subtitle.split(" · ")[0])}`;
    return "/admin";
  }

  function go(h: SearchHit) {
    onClose();
    router.push(hrefFor(h));
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flat[activeIdx]) {
      e.preventDefault();
      go(flat[activeIdx]);
    }
  }

  const hasAny = flat.length > 0;
  const showResults = query.trim().length >= 2;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
      style={{ background: "color-mix(in srgb, var(--bg-0) 70%, transparent)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] rounded-[14px] border border-line-2 bg-bg-1 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-line">
          <Icon name="search" size={16} className="text-fg-2 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder={t("adminSearch.placeholder")}
            className="flex-1 bg-transparent outline-none text-[15px] text-fg-0 placeholder:text-fg-3"
          />
          <kbd className="inline-flex items-center h-6 px-2 rounded text-[11px] font-mono text-fg-3 border border-line-2 bg-bg-2">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-auto">
          {!showResults && (
            <EmptyState
              icon="search"
              title={t("adminSearch.startTypingTitle")}
              subtitle={t("adminSearch.startTypingSubtitle")}
            />
          )}

          {showResults && pending && (
            <div className="px-4 py-3 text-[12px] text-fg-2">{t("adminSearch.searching")}</div>
          )}

          {showResults && !pending && !hasAny && (
            <EmptyState
              icon="info"
              title={t("adminSearch.noResultsTitle", { q: query })}
              subtitle={t("adminSearch.noResultsSubtitle")}
            />
          )}

          {showResults && hasAny && (
            <div className="py-2">
              <Group title={t("adminSearch.groupPages")}   items={groups.pages}    flat={flat} activeIdx={activeIdx} go={go} />
              <Group title={t("adminSearch.groupUsers")}   items={groups.users}    flat={flat} activeIdx={activeIdx} go={go} />
              <Group title={t("adminSearch.groupProjects")} items={groups.projects} flat={flat} activeIdx={activeIdx} go={go} />
              <Group title={t("adminSearch.groupAdmins")}  items={groups.admins}   flat={flat} activeIdx={activeIdx} go={go} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 h-10 border-t border-line text-[11px] text-fg-3 mono">
          <KbdHint k="↑↓" label={t("adminSearch.kbdNavigate")} />
          <KbdHint k="↵"  label={t("adminSearch.kbdOpen")} />
          <KbdHint k="esc" label={t("adminSearch.kbdClose")} />
        </div>
      </div>
    </div>
  );
}

function Group({
  title,
  items,
  flat,
  activeIdx,
  go,
}: {
  title: string;
  items: SearchHit[];
  flat: SearchHit[];
  activeIdx: number;
  go: (h: SearchHit) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.6px] text-fg-3 mono">
        {title}
      </div>
      {items.map((h) => {
        const idx = flat.indexOf(h);
        const active = idx === activeIdx;
        return (
          <button
            key={`${h.type}-${h.id}`}
            type="button"
            onClick={() => go(h)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-start ${
              active ? "bg-accent/10" : "hover:bg-bg-2"
            }`}
          >
            <Icon
              name={
                h.type === "user"    ? "user"       :
                h.type === "project" ? "folder"     :
                h.type === "page"    ? "arrowRight" : "bolt"
              }
              size={14}
              className={active ? "text-accent" : "text-fg-2"}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-fg-0 truncate">{h.title}</div>
              <div className="text-[11px] text-fg-2 truncate mono">{h.subtitle}</div>
            </div>
            <Icon name="arrowRight" size={12} className="text-fg-3" />
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: "search" | "info";
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-4 py-10 text-center">
      <div className="mx-auto w-10 h-10 rounded-full bg-bg-2 border border-line flex items-center justify-center">
        <Icon name={icon} size={16} className="text-fg-3" />
      </div>
      <div className="mt-3 text-[13px] text-fg-0 font-medium">{title}</div>
      <div className="text-[12px] text-fg-2 mt-1">{subtitle}</div>
    </div>
  );
}

function KbdHint({ k, label }: { k: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <kbd className="inline-flex items-center h-5 px-1.5 rounded text-[10px] font-mono text-fg-2 border border-line-2 bg-bg-2">
        {k}
      </kbd>
      <span>{label}</span>
    </div>
  );
}
