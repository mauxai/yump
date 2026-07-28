"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/(admin)/admin/settings/actions";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";

type Initial = {
  freeCreditEnabled: boolean;
  freeCreditAmount: number;
};

export function BusinessForm({ initial }: { initial: Initial }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();

  const [freeCreditEnabled, setFreeCreditEnabled] = useState(initial.freeCreditEnabled);
  const [freeCreditAmount, setFreeCreditAmount] = useState(
    initial.freeCreditAmount > 0 ? String(initial.freeCreditAmount) : ""
  );

  const dirty =
    freeCreditEnabled !== initial.freeCreditEnabled ||
    parseInt(freeCreditAmount || "0", 10) !== initial.freeCreditAmount;

  function handleReset() {
    setFreeCreditEnabled(initial.freeCreditEnabled);
    setFreeCreditAmount(initial.freeCreditAmount > 0 ? String(initial.freeCreditAmount) : "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const amount = parseInt(freeCreditAmount || "0", 10);
    if (freeCreditEnabled && (isNaN(amount) || amount <= 0)) {
      toast.error(t("adminBusiness.errorPositiveNumber"));
      return;
    }

    start(async () => {
      const id = toast.loading(t("adminBusiness.toastSaving"));
      const res = await saveSettings("business", [
        { key: "business.free_credit_enabled", value: freeCreditEnabled ? "true" : "false" },
        { key: "business.free_credit_amount",  value: freeCreditEnabled ? String(amount) : "0" },
      ]);
      if (res.ok) {
        toast.resolve(id, "success", t("adminBusiness.toastSaved"));
        router.refresh();
      } else {
        toast.resolve(id, "error", res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-5">

        {/* ── Registration ─────────────────────────────────────── */}
        <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-line">
            <div className="text-[14px] font-semibold text-fg-0">{t("adminBusiness.sectionRegistration")}</div>
            <div className="text-[12px] text-fg-2 mt-0.5">
              {t("adminBusiness.sectionRegistrationDesc")}
            </div>
          </div>
          <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-0">

            {/* Toggle row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] font-medium text-fg-0">{t("adminBusiness.labelFreeCredits")}</div>
                <div className="text-[12px] text-fg-2 mt-0.5">
                  {t("adminBusiness.hintFreeCredits")}
                </div>
              </div>
              <button
                type="button"
                dir="ltr"
                role="switch"
                aria-checked={freeCreditEnabled}
                onClick={() => setFreeCreditEnabled((v) => !v)}
                className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line ${
                  freeCreditEnabled ? "bg-accent" : "bg-bg-3 border border-line-2"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
                    freeCreditEnabled ? "translate-x-[22px]" : "translate-x-[4px]"
                  }`}
                />
              </button>
            </div>

            {/* Amount — slides in when enabled */}
            <div
              className={`overflow-hidden transition-all duration-200 ${
                freeCreditEnabled ? "max-h-40 mt-5 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="pt-5 border-t border-line">
                <label className="block text-[12px] font-medium text-fg-1 mb-1.5">
                  {t("adminBusiness.labelAmount")}
                  <span className="text-[var(--danger)] ml-0.5">*</span>
                </label>
                <div className="flex items-center gap-3 max-w-[280px]">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={freeCreditAmount}
                    onChange={(e) => setFreeCreditAmount(e.target.value)}
                    placeholder="e.g. 50"
                    className="flex-1 h-9 px-3 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] mono outline-none focus:border-accent-line placeholder:text-fg-4"
                    tabIndex={freeCreditEnabled ? 0 : -1}
                  />
                  <span className="text-[12px] text-fg-2 shrink-0">{t("adminBusiness.unitCredits")}</span>
                </div>
                <p className="text-[11px] text-fg-3 mt-1.5">
                  {t("adminBusiness.hintAmount")}
                </p>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* Sticky action bar */}
      <div className="mt-6 sm:mt-8 flex items-center justify-between gap-4 sticky bottom-0 bg-bg-0/90 backdrop-blur-sm border-t border-line py-4 sm:py-5 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10">
        <div className="text-[12px] text-fg-3 min-w-0 truncate">
          {dirty ? t("adminBusiness.unsavedChanges") : t("adminBusiness.allChangesSaved")}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={pending}
              className="h-9 px-3 sm:px-4 inline-flex items-center rounded-[6px] border border-line-2 bg-transparent text-fg-1 text-[13px] font-medium hover:bg-bg-2 transition-colors disabled:opacity-50"
            >
              {t("adminBusiness.reset")}
            </button>
          )}
          <button
            type="submit"
            disabled={pending || !dirty}
            className="h-9 px-4 inline-flex items-center rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {pending ? t("adminBusiness.saving") : t("adminBusiness.saveChanges")}
          </button>
        </div>
      </div>
    </form>
  );
}
