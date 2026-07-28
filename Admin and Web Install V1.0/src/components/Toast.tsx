"use client";

import {
  createContext, useContext, useCallback, useState, useEffect, useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning" | "info" | "loading";

export type ToastItem = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number; // ms — 0 = never auto-dismiss
};

type ContextValue = {
  toasts: ToastItem[];
  add: (t: Omit<ToastItem, "id">) => string;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Omit<ToastItem, "id">>) => void;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  error:   6000,
  warning: 5000,
  info:    4000,
  loading: 0,
};

const MAX_TOASTS = 5;

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

type EventDetail = {
  op: "add" | "remove" | "update";
  id: string;
  variant?: ToastVariant;
  title?: string;
  description?: string;
  duration?: number;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((t: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    setToasts((prev) => [{ ...t, id }, ...prev].slice(0, MAX_TOASTS));
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const update = useCallback((id: string, patch: Partial<Omit<ToastItem, "id">>) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const variant = patch.variant ?? t.variant;
        return {
          ...t,
          ...patch,
          variant,
          duration: patch.duration !== undefined ? patch.duration : DURATIONS[variant],
        };
      })
    );
  }, []);

  // Imperative event-bus bridge (toast.success / toast.error / etc.)
  useEffect(() => {
    function handler(e: Event) {
      const d = (e as CustomEvent<EventDetail>).detail;
      if (d.op === "add") {
        const variant = d.variant ?? "info";
        setToasts((prev) => {
          if (prev.some((t) => t.id === d.id)) {
            return prev.map((t) =>
              t.id === d.id
                ? { ...t, variant, title: d.title ?? t.title, description: d.description, duration: d.duration ?? DURATIONS[variant] }
                : t
            );
          }
          return [
            { id: d.id, variant, title: d.title ?? "", description: d.description, duration: d.duration ?? DURATIONS[variant] },
            ...prev,
          ].slice(0, MAX_TOASTS);
        });
      } else if (d.op === "remove") {
        setToasts((prev) => prev.filter((t) => t.id !== d.id));
      } else if (d.op === "update") {
        const variant = d.variant;
        setToasts((prev) =>
          prev.map((t) => {
            if (t.id !== d.id) return t;
            const v = variant ?? t.variant;
            return {
              ...t,
              variant: v,
              title: d.title ?? t.title,
              description: d.description !== undefined ? d.description : t.description,
              duration: d.duration !== undefined ? d.duration : DURATIONS[v],
            };
          })
        );
      }
    }
    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, add, remove, update }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

// ─── Container (portal) ───────────────────────────────────────────────────────

const CSS = `
  @keyframes _tin  { from{opacity:0;transform:translateX(calc(100% + 20px))} to{opacity:1;transform:translateX(0)} }
  @keyframes _tout { from{opacity:1;transform:translateX(0);max-height:120px;padding-top:14px;padding-bottom:14px;margin-bottom:0}
                       to{opacity:0;transform:translateX(calc(100% + 20px));max-height:0;padding-top:0;padding-bottom:0;margin-bottom:-10px} }
  @keyframes _tprog { from{width:100%} to{width:0%} }
  ._tin  { animation: _tin  0.22s cubic-bezier(.16,1,.3,1) forwards }
  ._tout { animation: _tout 0.2s  ease-in                  forwards }
  ._prog { animation: _tprog linear                        forwards }
`;

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <>
      <style>{CSS}</style>
      <div
        role="region"
        aria-label="Notifications"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 w-[360px] pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastBubble key={t.id} toast={t} onRemove={onRemove} />
        ))}
      </div>
    </>,
    document.body
  );
}

// ─── Single toast bubble ──────────────────────────────────────────────────────

const VARIANT_CFG: Record<ToastVariant, { bar: string; progress: string; icon: ReactNode }> = {
  success: {
    bar:      "bg-[#10a37f]",
    progress: "bg-[#10a37f]",
    icon: <CheckCircle2 size={15} className="text-[#10a37f] shrink-0 mt-px" />,
  },
  error: {
    bar:      "bg-[var(--danger,#ef4444)]",
    progress: "bg-[var(--danger,#ef4444)]",
    icon: <XCircle size={15} className="text-[var(--danger,#ef4444)] shrink-0 mt-px" />,
  },
  warning: {
    bar:      "bg-[#f59e0b]",
    progress: "bg-[#f59e0b]",
    icon: <AlertTriangle size={15} className="text-[#f59e0b] shrink-0 mt-px" />,
  },
  info: {
    bar:      "bg-[#3b82f6]",
    progress: "bg-[#3b82f6]",
    icon: <Info size={15} className="text-[#3b82f6] shrink-0 mt-px" />,
  },
  loading: {
    bar:      "bg-fg-3",
    progress: "bg-fg-3",
    icon: <Loader2 size={15} className="text-fg-2 shrink-0 mt-px animate-spin" />,
  },
};

function ToastBubble({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const { id, variant, title, description, duration } = toast;
  const cfg = VARIANT_CFG[variant];

  const leavingRef = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function dismiss() {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    setTimeout(() => onRemove(id), 220);
  }

  // Auto-dismiss timer — re-runs when duration changes (e.g. loading → resolved)
  useEffect(() => {
    leavingRef.current = false;
    setLeaving(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (duration > 0) {
      timerRef.current = setTimeout(dismiss, duration);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, duration]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`pointer-events-auto relative flex items-start gap-3 rounded-xl border border-line bg-bg-1 shadow-[0_8px_32px_rgba(0,0,0,0.28)] overflow-hidden pl-[18px] pr-3.5 py-3.5 ${leaving ? "_tout" : "_tin"}`}
    >
      {/* Accent bar */}
      <div className={`absolute inset-y-0 left-0 w-[3px] ${cfg.bar}`} />

      {/* Icon */}
      {cfg.icon}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-fg-0 leading-[1.35]">{title}</p>
        {description && (
          <p className="text-[12px] text-fg-2 mt-[3px] leading-[1.4]">{description}</p>
        )}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 -mr-0.5 mt-[1px] w-[22px] h-[22px] flex items-center justify-center rounded-md text-fg-4 hover:text-fg-1 hover:bg-bg-3 transition-colors"
      >
        <X size={12} />
      </button>

      {/* Progress bar */}
      {duration > 0 && !leaving && (
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-bg-3">
          <div
            className={`h-full _prog ${cfg.progress}`}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}
