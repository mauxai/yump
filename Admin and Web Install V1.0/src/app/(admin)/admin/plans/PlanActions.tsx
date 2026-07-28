"use client";

import { useTransition, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, AlertTriangle, X, Star, Power, Pencil } from "lucide-react";
import { deletePlan, togglePlanActive, toggleRecommended } from "./actions";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";

/* ─── Shared confirm modal ─────────────────────────────────────────────── */

type ModalVariant = "danger" | "warning";

function ConfirmModal({
  title,
  subtitle,
  body,
  confirmLabel,
  variant,
  pending,
  onConfirm,
  onCancel,
  cancelLabel,
}: {
  title: string;
  subtitle: string;
  body: React.ReactNode;
  confirmLabel: React.ReactNode;
  variant: ModalVariant;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}) {
  const { t } = useT();
  const isDanger = variant === "danger";
  const accentColor = isDanger ? "#ef4444" : "#f59e0b";
  const gradientTo  = isDanger ? "#f87171" : "#fbbf24";
  const iconBg      = isDanger ? "bg-[#ef4444]/10" : "bg-[#f59e0b]/10";
  const iconColor   = isDanger ? "text-[#ef4444]" : "text-[#f59e0b]";
  const btnBg       = isDanger ? "bg-[#ef4444] hover:bg-[#dc2626]" : "bg-[#f59e0b] hover:bg-[#d97706]";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !pending) onCancel(); }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <style>{`@keyframes _mdl{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style>
      <div
        className="relative w-full max-w-[420px] rounded-2xl border border-line bg-bg-1 shadow-2xl overflow-hidden"
        style={{ animation: "_mdl 0.15s ease-out" }}
      >
        <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${accentColor}, ${gradientTo})` }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <AlertTriangle size={18} className={iconColor} />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-fg-0">{title}</div>
                <div className="text-[12px] text-fg-3 mt-0.5">{subtitle}</div>
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

          <div className="rounded-xl border border-line bg-bg-2 px-4 py-3 mb-5 text-[13px] text-fg-2 leading-relaxed">
            {body}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={onCancel}
              disabled={pending}
              className="h-9 px-4 rounded-[8px] border border-line-2 bg-bg-2 text-fg-1 text-[13px] font-medium hover:bg-bg-3 transition-colors disabled:opacity-50"
            >
              {cancelLabel ?? t("adminPlans.cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={pending}
              className={`h-9 px-4 rounded-[8px] text-white text-[13px] font-semibold transition-colors disabled:opacity-60 flex items-center gap-2 ${btnBg}`}
            >
              {pending ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  {t("adminPlans.working")}
                </>
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── PlanActions ──────────────────────────────────────────────────────── */

export function PlanActions({
  planId,
  planName,
  isActive,
  recommended,
}: {
  planId: string;
  planName: string;
  isActive: boolean;
  recommended: boolean;
}) {
  const { t } = useT();
  const router = useRouter();

  const [deletePending, startDelete] = useTransition();
  const [statusPending, startStatus] = useTransition();
  const [recPending,    startRec]    = useTransition();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  /* Delete */
  function handleDelete() {
    startDelete(async () => {
      const id = toast.loading(t("adminPlans.toastDeleting"));
      const res = await deletePlan(planId);
      setShowDeleteModal(false);
      if (res.ok) {
        toast.resolve(id, "success", t("adminPlans.toastDeleted"));
        router.refresh();
      } else {
        toast.resolve(id, "error", res.error);
      }
    });
  }

  /* Status toggle */
  function handleStatusToggle() {
    startStatus(async () => {
      const label = isActive ? t("adminPlans.toastDeactivating") : t("adminPlans.toastActivating");
      const id = toast.loading(label);
      const res = await togglePlanActive(planId);
      setShowStatusModal(false);
      if (res.ok) {
        toast.resolve(id, "success", isActive ? t("adminPlans.toastDeactivated") : t("adminPlans.toastActivated"));
        router.refresh();
      } else {
        toast.resolve(id, "error", res.error);
      }
    });
  }

  /* Recommended toggle */
  function handleRecommended() {
    startRec(async () => {
      const res = await toggleRecommended(planId);
      if (res.ok) {
        toast.success(recommended ? t("adminPlans.toastRecommendationRemoved") : t("adminPlans.toastRecommended"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const anyPending = deletePending || statusPending || recPending;

  return (
    <>
      <div className="flex items-center justify-end gap-1 w-full sm:w-auto">
        {/* Edit */}
        <Link
          href={`/admin/plans/${planId}/edit`}
          title={t("adminPlans.titleEdit")}
          className="h-8 sm:h-7 w-8 sm:w-7 inline-flex items-center justify-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-3 hover:text-fg-1 hover:bg-bg-3 transition-colors"
        >
          <Pencil size={13} />
        </Link>

        {/* Recommended */}
        <button
          type="button"
          onClick={handleRecommended}
          disabled={anyPending}
          title={recommended ? t("adminPlans.titleRemoveRecommendation") : t("adminPlans.titleMarkRecommended")}
          className={`h-8 sm:h-7 w-8 sm:w-7 inline-flex items-center justify-center rounded-[6px] border transition-colors disabled:opacity-50 ${
            recommended
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-line-2 bg-bg-2 text-fg-3 hover:text-accent hover:bg-bg-3"
          }`}
        >
          <Star size={13} fill={recommended ? "currentColor" : "none"} />
        </button>

        {/* Status toggle */}
        <button
          type="button"
          onClick={() => setShowStatusModal(true)}
          disabled={anyPending}
          title={isActive ? t("adminPlans.titleDeactivate") : t("adminPlans.titleActivate")}
          className={`h-8 sm:h-7 w-8 sm:w-7 inline-flex items-center justify-center rounded-[6px] border transition-colors disabled:opacity-50 ${
            isActive
              ? "border-[#10a37f]/40 bg-[#10a37f]/10 text-[#10a37f]"
              : "border-line-2 bg-bg-2 text-fg-3 hover:text-[#10a37f] hover:bg-bg-3"
          }`}
        >
          <Power size={13} />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          disabled={anyPending}
          title={t("adminPlans.titleDelete")}
          className="h-8 sm:h-7 w-8 sm:w-7 inline-flex items-center justify-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-3 hover:text-[#ef4444] hover:bg-bg-3 transition-colors disabled:opacity-50"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Status confirm modal */}
      {showStatusModal && (
        <ConfirmModal
          variant="warning"
          title={isActive ? t("adminPlans.deactivatePlanTitle") : t("adminPlans.activatePlanTitle")}
          subtitle={isActive ? t("adminPlans.deactivatePlanSubtitle") : t("adminPlans.activatePlanSubtitle")}
          body={
            isActive ? (
              <>
                {t("adminPlans.deactivatePlanBodyPre")} <strong className="text-fg-0">&ldquo;{planName}&rdquo;</strong> {t("adminPlans.deactivatePlanBodyPost")}
              </>
            ) : (
              <>
                {t("adminPlans.activatePlanBodyPre")} <strong className="text-fg-0">&ldquo;{planName}&rdquo;</strong> {t("adminPlans.activatePlanBodyPost")}
              </>
            )
          }
          confirmLabel={isActive ? t("adminPlans.deactivate") : t("adminPlans.activate")}
          pending={statusPending}
          onConfirm={handleStatusToggle}
          onCancel={() => !statusPending && setShowStatusModal(false)}
        />
      )}

      {/* Delete confirm modal */}
      {showDeleteModal && (
        <ConfirmModal
          variant="danger"
          title={t("adminPlans.deletePlanTitle")}
          subtitle={t("adminPlans.deletePlanSubtitle")}
          body={
            <>
              {t("adminPlans.deletePlanBodyPre")}{" "}
              <strong className="text-fg-0">&ldquo;{planName}&rdquo;</strong>.
              {" "}{t("adminPlans.deletePlanBodyPost")}
            </>
          }
          confirmLabel={
            <span className="flex items-center gap-1.5">
              <Trash2 size={13} /> {t("adminPlans.deletePlanConfirm")}
            </span>
          }
          pending={deletePending}
          onConfirm={handleDelete}
          onCancel={() => !deletePending && setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
