"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { getProviderName, getModelLabel, getCredentialFields } from "@/lib/ai-providers";
import { ModelRowActions } from "./ModelRowActions";
import { StatusToggle } from "./StatusToggle";

const PROVIDER_COLORS: Record<string, string> = {
  openai:    "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20",
  anthropic: "bg-[#d97757]/10 text-[#d97757] border-[#d97757]/20",
  google:    "bg-[#4285f4]/10 text-[#4285f4] border-[#4285f4]/20",
  mistral:   "bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/20",
  groq:      "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
  cohere:    "bg-[#39d353]/10 text-[#39d353] border-[#39d353]/20",
  azure:     "bg-[#0078d4]/10 text-[#0078d4] border-[#0078d4]/20",
};

function providerBadgeCls(p: string) {
  return PROVIDER_COLORS[p] ?? "bg-bg-3 text-fg-2 border-line-2";
}

function pageUrl(q: string, provider: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (provider) params.set("provider", provider);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/models${qs ? `?${qs}` : ""}`;
}

type ModelRow = {
  id: string;
  label: string;
  provider: string;
  modelId: string;
  credentials: Record<string, string> | null;
  creditCost: number;
  isActive: boolean;
  isDefault: boolean;
};

type Props = {
  models: ModelRow[];
  total: number;
  totalPages: number;
  page: number;
  q: string;
  providerFilter: string;
  allProviders: { provider: string }[];
};

export function ModelsContent({
  models,
  total,
  totalPages,
  page,
  q,
  providerFilter,
  allProviders,
}: Props) {
  const { t } = useT();

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">
            {t("adminModels.configuration")}
          </div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">{t("adminModels.title")}</h1>
          <p className="text-[13px] text-fg-2 mt-1 max-w-[540px] hidden sm:block">
            {t("adminModels.subtitle")}
          </p>
        </div>
        <Link
          href="/admin/models/new"
          className="shrink-0 h-9 px-3 sm:px-4 inline-flex items-center gap-1.5 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          <span className="text-[18px] leading-none">+</span>
          <span className="hidden sm:inline">{t("adminModels.addModel")}</span>
          <span className="sm:hidden">{t("adminModels.add")}</span>
        </Link>
      </div>

      {/* Search + provider filter bar */}
      <div className="flex flex-col gap-3 mb-4">
        <form action="/admin/models" method="get" className="flex items-center gap-2">
          {providerFilter && <input type="hidden" name="provider" value={providerFilter} />}
          <div className="relative flex-1 sm:max-w-[360px] flex items-center">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3"
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder={t("adminModels.searchPlaceholder")}
              className="w-full h-9 pl-8 pr-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none focus:border-accent-line"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center rounded-r-[6px] text-fg-3 hover:text-fg-0 hover:bg-bg-3 transition-colors border-l border-line-2"
              title="Search"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
            </button>
          </div>
          {(q || providerFilter) && (
            <Link
              href="/admin/models"
              className="h-9 inline-flex items-center px-3 rounded-[6px] border border-line-2 bg-transparent text-fg-2 text-[12px] hover:bg-bg-2 shrink-0"
            >
              {t("adminModels.clear")}
            </Link>
          )}
          <div className="ml-auto text-[12px] text-fg-3 shrink-0">
            {t("adminModels.models", { n: total })}
          </div>
        </form>

        {/* Provider filter pills */}
        {allProviders.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <Link
              href={pageUrl(q, "", 1)}
              className={`shrink-0 h-7 px-3 inline-flex items-center rounded-full border text-[11px] font-medium transition-colors ${
                !providerFilter
                  ? "bg-fg-0 text-bg-0 border-fg-0"
                  : "bg-transparent text-fg-2 border-line-2 hover:border-fg-2 hover:text-fg-0"
              }`}
            >
              {t("adminModels.all")}
            </Link>
            {allProviders.map(({ provider: p }) => (
              <Link
                key={p}
                href={pageUrl(q, p, 1)}
                className={`shrink-0 h-7 px-3 inline-flex items-center rounded-full border text-[11px] font-medium uppercase tracking-wide transition-colors ${
                  providerFilter === p
                    ? providerBadgeCls(p) + " font-semibold"
                    : "bg-transparent text-fg-2 border-line-2 hover:border-fg-2 hover:text-fg-0"
                }`}
              >
                {getProviderName(p)}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {models.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-line bg-bg-1 py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-full bg-bg-3 flex items-center justify-center text-fg-3 text-[20px]">⚡</div>
          {q ? (
            <>
              <div className="text-[14px] font-medium text-fg-0">{t("adminModels.noMatchTitle", { q })}</div>
              <Link href="/admin/models" className="text-[12px] text-accent hover:underline">{t("adminModels.clearSearch")}</Link>
            </>
          ) : (
            <>
              <div className="text-[14px] font-medium text-fg-0">{t("adminModels.noModelsTitle")}</div>
              <div className="text-[12px] text-fg-3 max-w-[280px]">
                {t("adminModels.noModelsSubtitle")}
              </div>
              <Link
                href="/admin/models/new"
                className="mt-2 h-8 px-4 inline-flex items-center rounded-[6px] bg-accent text-[var(--accent-fg)] text-[12px] font-medium hover:opacity-90"
              >
                {t("adminModels.addModel")}
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden sm:block rounded-[10px] border border-line bg-bg-1 overflow-hidden">
            <div className="grid grid-cols-[1fr_120px_180px_64px_130px_80px_176px] px-5 py-[10px] border-b border-line text-[11px] text-fg-2 uppercase tracking-[0.4px]">
              <div>{t("adminModels.colLabelModel")}</div>
              <div>{t("adminModels.colProvider")}</div>
              <div>{t("adminModels.colCredentials")}</div>
              <div>{t("adminModels.colCredit")}</div>
              <div>{t("adminModels.colStatus")}</div>
              <div>{t("adminModels.colDefault")}</div>
              <div className="text-right">{t("adminModels.colActions")}</div>
            </div>

            {models.map((m) => {
              const creds = m.credentials ?? {};
              const credFields = getCredentialFields(m.provider);
              const filledCount = credFields.filter((f) => creds[f.key]).length;
              const totalRequired = credFields.filter((f) => f.required).length;
              return (
                <div
                  key={m.id}
                  className="grid grid-cols-[1fr_120px_180px_64px_130px_80px_176px] px-5 py-[12px] border-b border-line last:border-0 items-center"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-fg-0 truncate">{m.label}</div>
                    <div className="text-[11px] text-fg-3 mono truncate mt-0.5">
                      {getModelLabel(m.provider, m.modelId)}
                      <span className="text-fg-4 ml-1">({m.modelId})</span>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center h-[20px] px-[8px] rounded-full border text-[10px] font-medium tracking-wide uppercase ${providerBadgeCls(m.provider)}`}>
                      {getProviderName(m.provider)}
                    </span>
                  </div>
                  <div className="text-[11px] text-fg-2 space-y-0.5">
                    {credFields.length === 0 ? (
                      <span className="text-fg-4">—</span>
                    ) : filledCount === 0 ? (
                      <span className="text-fg-4 italic">{t("adminModels.usingEnvVars")}</span>
                    ) : (
                      credFields.map((f) => (
                        <div key={f.key} className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${creds[f.key] ? "bg-accent" : "bg-fg-4"}`} />
                          <span className={creds[f.key] ? "text-fg-1" : "text-fg-4"}>
                            {f.label}
                            {creds[f.key] && (
                              <span className="ml-1 mono text-fg-3">
                                {String(creds[f.key]).slice(0, 4)}{"•".repeat(4)}
                              </span>
                            )}
                          </span>
                        </div>
                      ))
                    )}
                    {filledCount > 0 && filledCount < totalRequired && (
                      <div className="text-[10px] text-[var(--danger)] mt-0.5">
                        {t("adminModels.requiredMissing", { n: totalRequired - filledCount })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-semibold text-fg-0">{m.creditCost}</span>
                    <span className="text-[10px] text-fg-3">cr</span>
                  </div>
                  <div><StatusToggle modelId={m.id} isActive={m.isActive} /></div>
                  <div>
                    {m.isDefault ? (
                      <span className="inline-flex h-[20px] px-[8px] items-center rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 text-[10px] font-medium uppercase tracking-wide">
                        {t("adminModels.default")}
                      </span>
                    ) : (
                      <span className="text-fg-4 text-[11px]">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/models/${m.id}`}
                      className="h-7 px-2.5 inline-flex items-center rounded-[5px] border border-line-2 bg-accent text-[var(--accent-fg)] text-[11px] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                    >
                      {t("adminModels.view")}
                    </Link>
                    <Link
                      href={`/admin/models/${m.id}/edit`}
                      className="h-7 px-2.5 inline-flex items-center rounded-[5px] border border-line-2 bg-bg-2 text-fg-1 text-[11px] hover:bg-bg-3 transition-colors whitespace-nowrap shrink-0"
                    >
                      {t("adminModels.edit")}
                    </Link>
                    <ModelRowActions modelId={m.id} isDefault={m.isDefault} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Mobile card list ── */}
          <div className="sm:hidden flex flex-col gap-3">
            {models.map((m) => {
              const creds = m.credentials ?? {};
              const credFields = getCredentialFields(m.provider);
              const filledCount = credFields.filter((f) => creds[f.key]).length;
              const totalRequired = credFields.filter((f) => f.required).length;
              return (
                <div key={m.id} className="bg-bg-1 border border-line rounded-[12px] p-4 space-y-3">
                  {/* Top row: label + actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-fg-0 truncate">{m.label}</div>
                      <div className="text-[11px] text-fg-3 mono truncate mt-0.5">{m.modelId}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/admin/models/${m.id}`}
                        className="h-7 px-2.5 inline-flex items-center rounded-[6px] bg-accent text-[var(--accent-fg)] text-[11px] font-medium hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                      >
                        {t("adminModels.view")}
                      </Link>
                      <Link
                        href={`/admin/models/${m.id}/edit`}
                        className="h-7 px-2.5 inline-flex items-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[11px] whitespace-nowrap shrink-0"
                      >
                        {t("adminModels.edit")}
                      </Link>
                      <ModelRowActions modelId={m.id} isDefault={m.isDefault} />
                    </div>
                  </div>

                  {/* Meta row: provider + credit + default */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center h-[20px] px-[8px] rounded-full border text-[10px] font-medium tracking-wide uppercase ${providerBadgeCls(m.provider)}`}>
                      {getProviderName(m.provider)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px] text-fg-2">
                      <span className="font-semibold text-fg-0">{m.creditCost}</span>
                      <span className="text-fg-3 text-[10px]">cr</span>
                    </span>
                    {m.isDefault && (
                      <span className="inline-flex h-[20px] px-[8px] items-center rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 text-[10px] font-medium uppercase tracking-wide">
                        {t("adminModels.default")}
                      </span>
                    )}
                  </div>

                  {/* Credentials */}
                  {credFields.length > 0 && (
                    <div className="text-[11px] text-fg-2 space-y-1">
                      {filledCount === 0 ? (
                        <span className="text-fg-4 italic">{t("adminModels.usingEnvVars")}</span>
                      ) : (
                        credFields.map((f) => (
                          <div key={f.key} className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${creds[f.key] ? "bg-accent" : "bg-fg-4"}`} />
                            <span className={creds[f.key] ? "text-fg-1" : "text-fg-4"}>
                              {f.label}
                              {creds[f.key] && (
                                <span className="ml-1 mono text-fg-3">
                                  {String(creds[f.key]).slice(0, 4)}{"•".repeat(4)}
                                </span>
                              )}
                            </span>
                          </div>
                        ))
                      )}
                      {filledCount > 0 && filledCount < totalRequired && (
                        <div className="text-[10px] text-[var(--danger)]">
                          {t("adminModels.requiredMissing", { n: totalRequired - filledCount })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-line">
                    <span className="text-[12px] text-fg-2">{t("adminModels.status")}</span>
                    <StatusToggle modelId={m.id} isActive={m.isActive} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 gap-2">
              <div className="text-[12px] text-fg-3">
                {t("adminModels.pageOf", { page, total: totalPages })}
              </div>
              <div className="flex items-center gap-1">
                {page > 1 ? (
                  <Link href={pageUrl(q, providerFilter, page - 1)} className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3 transition-colors">
                    {t("adminModels.prev")}
                  </Link>
                ) : (
                  <span className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line bg-bg-1 text-fg-4 text-[12px] cursor-not-allowed">{t("adminModels.prev")}</span>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="h-8 w-8 inline-flex items-center justify-center text-fg-3 text-[12px]">…</span>
                    ) : (
                      <Link key={p} href={pageUrl(q, providerFilter, p as number)}
                        className={`h-8 w-8 inline-flex items-center justify-center rounded-[6px] text-[12px] font-medium transition-colors ${p === page ? "bg-accent text-[var(--accent-fg)]" : "border border-line-2 bg-bg-2 text-fg-1 hover:bg-bg-3"}`}>
                        {p}
                      </Link>
                    )
                  )}
                {page < totalPages ? (
                  <Link href={pageUrl(q, providerFilter, page + 1)} className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3 transition-colors">
                    {t("adminModels.next")}
                  </Link>
                ) : (
                  <span className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line bg-bg-1 text-fg-4 text-[12px] cursor-not-allowed">{t("adminModels.next")}</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
