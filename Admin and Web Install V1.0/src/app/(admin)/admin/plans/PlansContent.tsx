"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { useT } from "@/lib/i18n";
import { PlanActions } from "./PlanActions";

type Plan = {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  price: any;
  credits: number;
  createdAt: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type Props = {
  plans: Plan[];
  total: number;
  maxCredits: number;
  minCredits: number;
  q: string;
  currencySymbol: string;
};

export function PlansContent({ plans, total, maxCredits, minCredits, q, currencySymbol }: Props) {
  const { t } = useT();

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 sm:mb-8">
        <div>
          <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">
            {t("adminPlans.breadcrumb")}
          </div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">{t("adminPlans.title")}</h1>
          <p className="hidden sm:block text-[13px] text-fg-2 mt-1 max-w-[540px]">
            {t("adminPlans.subtitle")}
          </p>
        </div>
        <Link
          href="/admin/plans/new"
          className="shrink-0 h-9 px-4 inline-flex items-center gap-2 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          <span className="text-[18px] leading-none">+</span>
          <span className="hidden sm:inline">{t("adminPlans.newPlan")}</span>
          <span className="sm:hidden">{t("adminPlans.new")}</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5 sm:mb-6">
        <div className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4">
          <div className="text-[20px] sm:text-[28px] font-semibold mono tracking-tight text-fg-0">{total}</div>
          <div className="text-[11px] sm:text-[12px] text-fg-2 mt-0.5">{t("adminPlans.statTotal")}</div>
        </div>
        <div className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4">
          <div className="text-[20px] sm:text-[28px] font-semibold mono tracking-tight text-fg-0">{maxCredits}</div>
          <div className="text-[11px] sm:text-[12px] text-fg-2 mt-0.5">{t("adminPlans.statMax")}</div>
        </div>
        <div className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4">
          <div className="text-[20px] sm:text-[28px] font-semibold mono tracking-tight text-fg-0">{minCredits}</div>
          <div className="text-[11px] sm:text-[12px] text-fg-2 mt-0.5">{t("adminPlans.statMin")}</div>
        </div>
      </div>

      {/* Search bar */}
      <form action="/admin/plans" method="get" className="flex items-center gap-2 mb-4">
        <div className="text-[12px] text-fg-3 shrink-0">
          {t("adminPlans.planCount", { n: String(plans.length) })}
          {q ? ` of ${total}` : ""}
        </div>
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <input
              name="q"
              defaultValue={q}
              placeholder={t("adminPlans.searchPlaceholder")}
              className="w-full h-9 pl-3 pr-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none focus:border-accent-line placeholder:text-fg-4"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center rounded-r-[6px] text-fg-3 hover:text-fg-0 hover:bg-bg-3 transition-colors border-l border-line-2"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
            </button>
          </div>
          {q && (
            <Link
              href="/admin/plans"
              className="h-9 inline-flex items-center px-3 rounded-[6px] border border-line-2 bg-transparent text-fg-2 text-[12px] hover:bg-bg-2 shrink-0"
            >
              {t("adminPlans.clear")}
            </Link>
          )}
        </div>
      </form>

      {/* Empty state */}
      {plans.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-line bg-bg-1 py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center text-fg-3">
            <CreditCard size={22} />
          </div>
          {q ? (
            <>
              <div className="text-[15px] font-medium text-fg-0">{t("adminPlans.noMatchTitle").replace("{q}", q)}</div>
              <Link href="/admin/plans" className="text-[12px] text-accent hover:underline">{t("adminPlans.clearSearch")}</Link>
            </>
          ) : (
            <>
              <div className="text-[15px] font-medium text-fg-0">{t("adminPlans.noPlansTitle")}</div>
              <div className="text-[13px] text-fg-3 max-w-[280px]">
                {t("adminPlans.noPlansDesc")}
              </div>
              <Link
                href="/admin/plans/new"
                className="mt-2 h-9 px-4 inline-flex items-center rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90"
              >
                {t("adminPlans.createPlan")}
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-[10px] border border-line bg-bg-1 overflow-hidden">

          {/* Desktop table head */}
          <div className="hidden sm:grid grid-cols-[1fr_140px_110px_100px_100px_140px] px-6 py-[10px] border-b border-line bg-bg-2 text-[11px] text-fg-2 uppercase tracking-[0.4px]">
            <div>{t("adminPlans.colPlanName")}</div>
            <div>{t("adminPlans.colPrice")}</div>
            <div>{t("adminPlans.colCredits")}</div>
            <div>{t("adminPlans.colCreated")}</div>
            <div>{t("adminPlans.colStatus")}</div>
            <div className="text-right">{t("adminPlans.colActions")}</div>
          </div>

          {plans.map((plan) => {
            const isActive    = plan.isActive !== false;
            const recommended = plan.recommended === true;
            return (
              <div key={plan.id} className={`border-b border-line last:border-0 transition-colors ${!isActive ? "opacity-60" : ""}`}>

                {/* Desktop row */}
                <div className="hidden sm:grid grid-cols-[1fr_140px_110px_100px_100px_140px] px-6 py-[14px] items-center hover:bg-bg-2 transition-colors">
                  {/* Name */}
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-[14px] font-medium text-fg-0">{plan.name}</div>
                      {recommended && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                          {t("adminPlans.recommended")}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-fg-3 mono mt-0.5">{plan.id}</div>
                  </div>
                  {/* Price */}
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[13px] text-fg-3">{currencySymbol}</span>
                    <span className="text-[18px] font-semibold mono text-fg-0">{Number(plan.price).toFixed(2)}</span>
                    <span className="text-[11px] text-fg-3 ml-0.5">{t("adminPlans.perMonth")}</span>
                  </div>
                  {/* Credits */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[18px] font-semibold mono text-fg-0">{plan.credits}</span>
                    <span className="text-[11px] text-fg-3">{t("adminPlans.credits")}</span>
                  </div>
                  {/* Created */}
                  <div className="text-[12px] text-fg-3">
                    {new Date(plan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  {/* Status */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full border text-[10px] font-semibold ${
                      isActive ? "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20" : "bg-fg-3/10 text-fg-3 border-line-2"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#10a37f]" : "bg-fg-3"}`} />
                      {isActive ? t("adminPlans.statusActive") : t("adminPlans.statusInactive")}
                    </span>
                  </div>
                  {/* Actions */}
                  <PlanActions planId={plan.id} planName={plan.name} isActive={isActive} recommended={recommended} />
                </div>

                {/* Mobile card */}
                <div className="sm:hidden px-4 pt-4 pb-3">
                  {/* Top: name + status */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[15px] font-semibold text-fg-0 truncate">{plan.name}</span>
                      {recommended && (
                        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                          {t("adminPlans.recommended")}
                        </span>
                      )}
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 h-[22px] px-2.5 rounded-full border text-[10px] font-semibold ${
                      isActive ? "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20" : "bg-fg-3/10 text-fg-3 border-line-2"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#10a37f]" : "bg-fg-3"}`} />
                      {isActive ? t("adminPlans.statusActive") : t("adminPlans.statusInactive")}
                    </span>
                  </div>

                  {/* Price + credits */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[12px] text-fg-3">{currencySymbol}</span>
                      <span className="text-[17px] font-semibold mono text-fg-0">{Number(plan.price).toFixed(2)}</span>
                      <span className="text-[11px] text-fg-3 ml-0.5">{t("adminPlans.perMonth")}</span>
                    </div>
                    <div className="w-px h-3 bg-line-2" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-[17px] font-semibold mono text-fg-0">{plan.credits}</span>
                      <span className="text-[11px] text-fg-3">{t("adminPlans.credits")}</span>
                    </div>
                  </div>

                  {/* Action strip */}
                  <div className="flex items-center gap-2 pt-2 border-t border-line">
                    <PlanActions planId={plan.id} planName={plan.name} isActive={isActive} recommended={recommended} />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
