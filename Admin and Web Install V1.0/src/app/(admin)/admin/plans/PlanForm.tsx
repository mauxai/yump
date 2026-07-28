"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPlan, updatePlan } from "./actions";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";

type Plan = { id: string; name: string; credits: number; price: number };

export function PlanForm({
  initial,
  currencySymbol = "$",
}: {
  initial?: Plan;
  currencySymbol?: string;
}) {
  const { t } = useT();
  const router = useRouter();
  const isEdit = !!initial;
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = isEdit
        ? await updatePlan(initial!.id, fd)
        : await createPlan(fd);
      if (!res.ok) toast.error(res.error);
      else router.push("/admin/plans");
    });
  }

  return (
    <div className="max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">
          {t("adminPlans.breadcrumb")}
        </div>
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">
          {isEdit ? t("adminPlans.editPlan") : t("adminPlans.newPlan")}
        </h1>
        <p className="text-[13px] text-fg-2 mt-1">
          {isEdit
            ? t("adminPlans.editPlanDesc")
            : t("adminPlans.newPlanDesc")}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">

          {/* Left — fields */}
          <div className="space-y-4">
            <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-line">
                <div className="text-[14px] font-semibold text-fg-0">{t("adminPlans.sectionDetails")}</div>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-5">

                {/* Name */}
                <div>
                  <label className="block text-[12px] font-medium text-fg-1 mb-1.5">
                    {t("adminPlans.labelName")}
                    <span className="text-[var(--danger)] ml-0.5">*</span>
                  </label>
                  <input
                    name="name"
                    defaultValue={initial?.name ?? ""}
                    required
                    placeholder="e.g. Starter, Pro, Enterprise"
                    className="w-full h-9 px-3 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none focus:border-accent-line placeholder:text-fg-4"
                  />
                </div>

                {/* Credits + Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-fg-1 mb-1.5">
                      {t("adminPlans.labelCredits")}
                      <span className="text-[var(--danger)] ml-0.5">*</span>
                    </label>
                    <input
                      name="credits"
                      type="number"
                      min="0"
                      defaultValue={initial?.credits ?? ""}
                      required
                      placeholder="e.g. 100"
                      className="w-full h-9 px-3 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none focus:border-accent-line placeholder:text-fg-4"
                    />
                    <p className="text-[11px] text-fg-3 mt-1.5">{t("adminPlans.hintCredits")}</p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-fg-1 mb-1.5">
                      {t("adminPlans.labelPrice")}
                      <span className="text-[var(--danger)] ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 text-[13px]">{currencySymbol}</span>
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={initial?.price ?? ""}
                        required
                        placeholder="0.00"
                        className="w-full h-9 pl-6 pr-3 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none focus:border-accent-line placeholder:text-fg-4"
                      />
                    </div>
                    <p className="text-[11px] text-fg-3 mt-1.5">{t("adminPlans.hintPrice")}</p>
                  </div>
                </div>

              </div>
            </section>
          </div>

          {/* Right — info (desktop only) */}
          <div className="hidden lg:block">
            <section className="rounded-xl border border-line bg-bg-1 overflow-hidden sticky top-6">
              <div className="px-6 py-4 border-b border-line">
                <div className="text-[14px] font-semibold text-fg-0">{t("adminPlans.sectionAbout")}</div>
              </div>
              <div className="px-6 py-5 space-y-3 text-[13px] text-fg-2">
                <p>{t("adminPlans.aboutDesc1")}</p>
                <p>{t("adminPlans.aboutDesc2")}</p>
                <div className="mt-4 pt-4 border-t border-line space-y-2 text-[12px]">
                  <div className="flex items-center gap-2 text-fg-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    {t("adminPlans.aboutBullet1")}
                  </div>
                  <div className="flex items-center gap-2 text-fg-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    {t("adminPlans.aboutBullet2")}
                  </div>
                </div>
              </div>
            </section>
          </div>

        </div>

        {/* Sticky action bar */}
        <div className="mt-6 sm:mt-8 flex items-center justify-between gap-4 sticky bottom-0 bg-bg-0/90 backdrop-blur-sm border-t border-line py-4 sm:py-5 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10">
          <div className="text-[12px] min-w-0 truncate">
            <span className="text-fg-3">
              {isEdit ? t("adminPlans.editingPlan") : t("adminPlans.newPlan")}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/plans"
              className="h-10 sm:h-9 px-4 inline-flex items-center rounded-[6px] border border-line-2 bg-transparent text-fg-1 text-[13px] font-medium hover:bg-bg-2 transition-colors"
            >
              {t("adminPlans.cancel")}
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="h-10 sm:h-9 px-4 inline-flex items-center rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending ? (isEdit ? t("adminPlans.saving") : t("adminPlans.creating")) : (isEdit ? t("adminPlans.saveChanges") : t("adminPlans.createPlan"))}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
