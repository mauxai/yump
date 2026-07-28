"use client";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

export type ComboOption = {
  value: string;
  label: string;
  hint?: string;
};

type ComboboxProps = {
  value: string;
  options: ComboOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: Parameters<typeof Icon>[0]["name"];
  maxHeight?: number;
  disabled?: boolean;
};

type Coords = { top: number; left: number; width: number; flip: boolean };

export function Combobox({
  value,
  options,
  onChange,
  placeholder = "Select…",
  icon,
  maxHeight = 280,
  disabled,
}: ComboboxProps) {
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery]     = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [coords, setCoords]   = useState<Coords>({ top: 0, left: 0, width: 0, flip: false });
  const [isMobile, setIsMobile] = useState(false);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.hint?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Position dropdown for desktop; skip on mobile (bottom sheet)
  useLayoutEffect(() => {
    if (!open || isMobile) return;
    function place() {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const needed = maxHeight + 48;
      const flip = spaceBelow < needed && r.top > spaceBelow;
      setCoords({ top: flip ? r.top - 4 : r.bottom + 4, left: r.left, width: r.width, flip });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, maxHeight, isMobile]);

  useEffect(() => {
    if (open) {
      setActiveIdx(Math.max(0, filtered.findIndex((o) => o.value === value)));
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open, filtered, value]);

  // Click outside closes
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, open]);

  function choose(opt: ComboOption) {
    onChange(opt.value);
    setOpen(false);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIdx]) choose(filtered[activeIdx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    }
  }

  // ── Mobile bottom sheet ──────────────────────────────────────────────────────
  const mobileSheet = mounted && open && isMobile
    ? createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          {/* Sheet */}
          <div
            ref={dropRef}
            className="relative z-10 bg-bg-0 rounded-t-[20px] overflow-hidden flex flex-col"
            style={{ maxHeight: "80vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <div className="w-10 h-1 rounded-full bg-line-2 absolute left-1/2 -translate-x-1/2 top-3" />
              <span className="text-[15px] font-semibold text-fg-0 mt-2">
                {selected ? selected.label : placeholder}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 w-7 h-7 rounded-full bg-bg-3 flex items-center justify-center text-fg-2 active:bg-bg-2"
              >
                <Icon name="close" size={13} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-3 shrink-0">
              <div className="flex items-center gap-2 h-10 px-3 rounded-[10px] bg-bg-2 border border-line-2">
                <Icon name="search" size={14} className="text-fg-3 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
                  onKeyDown={onKey}
                  placeholder="Search…"
                  className="flex-1 bg-transparent outline-none text-[14px] text-fg-0 placeholder:text-fg-3"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                    className="w-5 h-5 rounded-full bg-bg-3 flex items-center justify-center text-fg-3"
                  >
                    <Icon name="close" size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-line shrink-0" />

            {/* List */}
            <div ref={listRef} className="overflow-auto flex-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-10 text-center text-[13px] text-fg-3">No matches</div>
              ) : (
                filtered.map((opt, i) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      data-idx={i}
                      onClick={() => choose(opt)}
                      className={`w-full flex items-center gap-3 px-4 py-[14px] text-[14px] text-left border-b border-line last:border-0 transition-colors active:bg-bg-2 ${
                        isSelected ? "bg-accent/8" : ""
                      }`}
                    >
                      <span className={`flex-1 ${isSelected ? "text-fg-0 font-semibold" : "text-fg-1"}`}>
                        {opt.label}
                      </span>
                      {opt.hint && (
                        <span className="text-[12px] text-fg-3 mono shrink-0">{opt.hint}</span>
                      )}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <Icon name="arrowRight" size={10} className="text-[var(--accent-fg)]" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
              {/* Safe area bottom padding */}
              <div className="h-6" />
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  // ── Desktop dropdown ─────────────────────────────────────────────────────────
  const desktopDrop = mounted && open && !isMobile
    ? createPortal(
        <div
          ref={dropRef}
          className="z-[60] bg-bg-1 border border-line-2 rounded-[8px] shadow-xl overflow-hidden"
          style={{
            position: "fixed",
            top:    coords.flip ? undefined : coords.top,
            bottom: coords.flip ? window.innerHeight - coords.top : undefined,
            left:   coords.left,
            width:  coords.width,
            minWidth: 220,
          }}
        >
          <div className="flex items-center gap-2 h-9 px-3 border-b border-line">
            <Icon name="search" size={13} className="text-fg-2 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
              onKeyDown={onKey}
              placeholder="Type to filter…"
              className="flex-1 bg-transparent outline-none text-[13px] text-fg-0 placeholder:text-fg-3"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="text-fg-3 hover:text-fg-0"
              >
                <Icon name="close" size={11} />
              </button>
            )}
          </div>
          <div ref={listRef} className="overflow-auto py-1" style={{ maxHeight }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12px] text-fg-3">No matches</div>
            ) : (
              filtered.map((opt, i) => {
                const isActive   = i === activeIdx;
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-idx={i}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => choose(opt)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-left transition-colors ${
                      isActive ? "bg-bg-2" : ""
                    } ${isSelected ? "text-fg-0 font-medium" : "text-fg-1"}`}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {opt.hint && (
                      <span className="text-[11px] text-fg-3 mono shrink-0">{opt.hint}</span>
                    )}
                    {isSelected && (
                      <Icon name="arrowRight" size={11} className="text-accent shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full h-9 sm:h-9 rounded-[6px] bg-bg-2 border text-[13px] outline-none transition-colors flex items-center gap-2 px-3 ${
          disabled
            ? "text-fg-3 cursor-not-allowed opacity-60 border-line-2"
            : open
              ? "text-fg-0 border-accent-line bg-bg-1"
              : "text-fg-0 border-line-2 hover:bg-bg-3"
        }`}
      >
        {icon && <Icon name={icon} size={13} className="text-fg-2 shrink-0" />}
        <span className={`flex-1 text-left truncate ${selected ? "" : "text-fg-3"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon name="arrowRight" size={11} className="text-fg-2 shrink-0 rotate-90" />
      </button>

      {mobileSheet}
      {desktopDrop}
    </>
  );
}
