"use client";

import { useTransition, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { deletePlan } from "./actions";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";

function DeleteModal({
  planName,
  onConfirm,
  onCancel,
  pending,
}: {
  planName: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const { t } = useT();
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !pending) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Panel */}
      <style>{`@keyframes _mdl{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style>
      <div className="relative w-full max-w-[420px] rounded-2xl border border-line bg-bg-1 shadow-2xl overflow-hidden" style={{ animation: "_mdl 0.15s ease-out" }}>

        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#ef4444] to-[#f87171]" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-[#ef4444]" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-fg-0">{t("adminPlans.deletePlanTitle")}</div>
                <div className="text-[12px] text-fg-3 mt-0.5">{t("adminPlans.deletePlanSubtitle")}</div>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={pending}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-fg-3 hover:text-fg-1 hover:bg-bg-3 transition-colors disabled:opacity-50"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="rounded-xl border border-line bg-bg-2 px-4 py-3 mb-5">
            <p className="text-[13px] text-fg-2 leading-relaxed">
              {t("adminPlans.deletePlanBodyPre")}{" "}
              <span className="font-semibold text-fg-0">&ldquo;{planName}&rdquo;</span>.
              {" "}{t("adminPlans.deletePlanBodyPost")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={onCancel}
              disabled={pending}
              className="h-9 px-4 rounded-[8px] border border-line-2 bg-bg-2 text-fg-1 text-[13px] font-medium hover:bg-bg-3 transition-colors disabled:opacity-50"
            >
              {t("adminPlans.cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={pending}
              className="h-9 px-4 rounded-[8px] bg-[#ef4444] text-white text-[13px] font-semibold hover:bg-[#dc2626] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {pending ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  {t("adminPlans.saving")}
                </>
              ) : (
                <>
                  <Trash2 size={13} />
                  {t("adminPlans.deletePlanConfirm")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PlanRowActions({ planId, planName }: { planId: string; planName: string }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    start(async () => {
      const id = toast.loading(t("adminPlans.toastDeleting"));
      const res = await deletePlan(planId);
      setOpen(false);
      if (res.ok) {
        toast.resolve(id, "success", t("adminPlans.toastDeleted"));
        router.refresh();
      } else {
        toast.resolve(id, "error", res.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t("adminPlans.titleDelete")}
        className="h-7 w-7 inline-flex items-center justify-center rounded-[5px] border border-line-2 bg-bg-2 text-fg-3 hover:text-[#ef4444] hover:bg-bg-3 transition-colors"
      >
        <Trash2 size={13} />
      </button>

      {open && (
        <DeleteModal
          planName={planName}
          onConfirm={handleConfirm}
          onCancel={() => !pending && setOpen(false)}
          pending={pending}
        />
      )}
    </>
  );
}
