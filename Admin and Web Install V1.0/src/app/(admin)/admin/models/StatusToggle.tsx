"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleModelActive } from "./actions";
import { useT } from "@/lib/i18n";

export function StatusToggle({
  modelId,
  isActive: initialIsActive,
}: {
  modelId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const { t } = useT();
  const [pending, start] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [isActive, setIsActive] = useState(initialIsActive);

  function handleConfirm() {
    const next = !isActive;
    setShowModal(false);
    setIsActive(next); // optimistic update
    start(async () => {
      const res = await toggleModelActive(modelId, next);
      if (!res.ok) {
        setIsActive(!next); // revert on error
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      {/* Toggle switch */}
      <button
        type="button"
        onClick={() => !pending && setShowModal(true)}
        disabled={pending}
        title={isActive ? t("adminModels.clickToDeactivate") : t("adminModels.clickToActivate")}
        className="flex items-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        <div dir="ltr" className={`relative w-11 h-6 rounded-full border transition-colors duration-200 shrink-0 ${
          isActive ? "bg-accent border-accent" : "bg-bg-1 border-line-2"
        }`}>
          <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md transition-all duration-200 ${
            isActive ? "translate-x-[20px] bg-white" : "translate-x-[3px] bg-fg-3"
          }`} />
        </div>
        <span className={`text-[11px] font-medium whitespace-nowrap ${
          isActive ? "text-accent" : "text-fg-3"
        }`}>
          {pending ? t("adminModels.saving") : isActive ? t("adminModels.active") : t("adminModels.inactive")}
        </span>
      </button>

      {/* Confirm modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setShowModal(false)} />

          <div
            className="relative z-10 w-full max-w-[360px] mx-4 rounded-[12px] border border-line bg-bg-1 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isActive ? "bg-[var(--danger)]/10" : "bg-accent/10"
              }`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke={isActive ? "var(--danger)" : "var(--accent)"}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  {isActive
                    ? <><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></>
                    : <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>
                  }
                </svg>
              </div>
              <div>
                <div className="text-[14px] font-semibold text-fg-0">
                  {isActive ? t("adminModels.deactivateTitle") : t("adminModels.activateTitle")}
                </div>
                <div className="text-[12px] text-fg-3 mt-0.5">
                  {isActive ? t("adminModels.deactivateDesc") : t("adminModels.activateDesc")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-8 px-4 rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3 transition-colors"
              >
                {t("adminModels.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`h-8 px-4 rounded-[6px] text-[12px] font-medium hover:opacity-90 transition-opacity ${
                  isActive
                    ? "bg-[var(--danger)] text-white"
                    : "bg-accent text-[var(--accent-fg)]"
                }`}
              >
                {isActive ? t("adminModels.yesDeactivate") : t("adminModels.yesActivate")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
