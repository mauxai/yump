"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/Icon";

type Variant = "danger" | "warning";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  icon?: IconName;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  icon = "trash",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open || typeof document === "undefined") return null;

  const isDanger = variant === "danger";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-[400px] bg-bg-0 rounded-2xl border border-line shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className={`h-1 w-full ${isDanger ? "bg-[var(--danger)]" : "bg-[#f59e0b]"}`} />

        <div className="px-6 pt-5 pb-6">
          {/* Icon + title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger ? "bg-[var(--danger)]/10" : "bg-[#f59e0b]/10"
            }`}>
              <Icon
                name={icon}
                size={18}
                className={isDanger ? "text-[var(--danger)]" : "text-[#f59e0b]"}
              />
            </div>
            <div className="pt-0.5">
              <div className="text-[15px] font-semibold text-fg-0">{title}</div>
              {description && (
                <p className="text-[13px] text-fg-2 mt-1 leading-relaxed">{description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={onCancel}
              className="h-9 px-4 rounded-lg border border-line-2 text-[13px] font-medium text-fg-1 hover:bg-bg-2 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`h-9 px-4 rounded-lg text-[13px] font-medium text-white transition-colors ${
                isDanger
                  ? "bg-[var(--danger)] hover:opacity-90"
                  : "bg-[#f59e0b] hover:opacity-90"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
