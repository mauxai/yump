"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/Icon";
import { getProviderName, getModelLabel, type CredentialField } from "@/lib/ai-providers";
import { StatusToggle } from "../StatusToggle";

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

type Props = {
  model: {
    id: string;
    label: string;
    provider: string;
    modelId: string;
    credentials: Record<string, string> | null;
    creditCost: number;
    isActive: boolean;
    isDefault: boolean;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  };
  credFields: readonly CredentialField[];
  filledCount: number;
  totalRequired: number;
};

export function ModelViewContent({ model, credFields, filledCount, totalRequired }: Props) {
  const { t, lang } = useT();
  const creds = model.credentials ?? {};

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[780px] mx-auto">
      {/* Back */}
      <Link href="/admin/models" className="inline-flex items-center gap-1.5 text-[12px] text-fg-2 hover:text-fg-0 mb-5">
        <Icon name="arrowLeft" size={12} /> {t("adminModels.backToModels")}
      </Link>

      {/* Header card */}
      <div className="bg-bg-1 border border-line rounded-[14px] p-4 sm:p-6 mb-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className={`w-12 h-12 rounded-[12px] border flex items-center justify-center text-[22px] shrink-0 ${providerBadgeCls(model.provider)}`}>
          ⚡
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[20px] sm:text-[22px] font-semibold text-fg-0 tracking-tight">{model.label}</h1>
            <span className={`inline-flex items-center h-[20px] px-[8px] rounded-full border text-[10px] font-medium tracking-wide uppercase ${providerBadgeCls(model.provider)}`}>
              {getProviderName(model.provider)}
            </span>
            {model.isDefault && (
              <span className="inline-flex h-[20px] px-[8px] items-center rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 text-[10px] font-medium uppercase tracking-wide">
                {t("adminModels.default")}
              </span>
            )}
          </div>
          <div className="text-[12px] text-fg-3 mono mt-0.5">{model.modelId}</div>
        </div>
        <Link
          href={`/admin/models/${model.id}/edit`}
          className="shrink-0 h-9 px-4 inline-flex items-center gap-1.5 rounded-[8px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          <Icon name="settings" size={13} /> {t("adminModels.edit")}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Model info */}
        <Card title={t("adminModels.modelInfo")} icon="cpu">
          <KV k={t("adminModels.kvLabel")}      v={model.label} />
          <KV k={t("adminModels.kvProvider")}   v={getProviderName(model.provider)} />
          <KV k={t("adminModels.kvModelId")}    v={getModelLabel(model.provider, model.modelId)} mono />
          <KV k={t("adminModels.kvRawId")}      v={model.modelId} mono />
          <KV k={t("adminModels.kvCreditCost")} v={`${model.creditCost} cr`} mono />
          <div className="flex justify-between py-[5px] text-[12px] border-b border-dashed border-line last:border-0 gap-4">
            <span className="text-fg-2 shrink-0">{t("adminModels.kvCreated")}</span>
            <span className="text-fg-0 text-right truncate" suppressHydrationWarning>
              {new Date(model.createdAt).toLocaleDateString(lang)}
            </span>
          </div>
          <div className="flex justify-between py-[5px] text-[12px] border-b border-dashed border-line last:border-0 gap-4">
            <span className="text-fg-2 shrink-0">{t("adminModels.kvUpdated")}</span>
            <span className="text-fg-0 text-right truncate" suppressHydrationWarning>
              {new Date(model.updatedAt).toLocaleDateString(lang)}
            </span>
          </div>
        </Card>

        {/* Status */}
        <Card title={t("adminModels.status")} icon="bolt">
          <div className="flex items-center justify-between py-[5px] text-[12px] border-b border-dashed border-line">
            <span className="text-fg-2">{t("adminModels.kvActive")}</span>
            <StatusToggle modelId={model.id} isActive={model.isActive} />
          </div>
          <div className="flex items-center justify-between py-[5px] text-[12px] border-b border-dashed border-line last:border-0">
            <span className="text-fg-2">{t("adminModels.kvDefaultModel")}</span>
            {model.isDefault ? (
              <span className="inline-flex h-[20px] px-[8px] items-center rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 text-[10px] font-medium uppercase">{t("adminModels.default")}</span>
            ) : (
              <span className="text-fg-3 text-[12px]">{t("adminModels.no")}</span>
            )}
          </div>
          {model.notes && (
            <div className="mt-3 pt-3 border-t border-line">
              <div className="text-[10px] text-fg-3 uppercase tracking-[0.5px] mb-1">{t("adminModels.notes")}</div>
              <p className="text-[12px] text-fg-1 leading-relaxed">{model.notes}</p>
            </div>
          )}
        </Card>

        {/* Credentials */}
        <Card title={t("adminModels.credentials")} icon="lock" className="sm:col-span-2">
          {credFields.length === 0 ? (
            <p className="text-[12px] text-fg-3 italic">{t("adminModels.noCredRequired")}</p>
          ) : filledCount === 0 ? (
            <p className="text-[12px] text-fg-3 italic">{t("adminModels.usingEnvVarsLong")}</p>
          ) : (
            <div className="space-y-2">
              {filledCount > 0 && filledCount < totalRequired && (
                <div className="mb-3 px-3 py-2 rounded-[8px] bg-[var(--danger)]/8 border border-[var(--danger)]/20 text-[12px] text-[var(--danger)]">
                  {t("adminModels.requiredCredMissing", { n: totalRequired - filledCount })}
                </div>
              )}
              {credFields.map((f) => (
                <div key={f.key} className="flex items-center justify-between py-2 border-b border-dashed border-line last:border-0 gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${creds[f.key] ? "bg-accent" : "bg-fg-4"}`} />
                    <span className="text-[12px] text-fg-2">{f.label}</span>
                    {f.required && <span className="text-[10px] text-fg-4">{t("adminModels.required")}</span>}
                  </div>
                  {creds[f.key] ? (
                    <span className="mono text-[12px] text-fg-1">
                      {String(creds[f.key]).slice(0, 6)}{"•".repeat(6)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-fg-4 italic">{t("adminModels.notSet")}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

function Card({ title, icon, children, className }: {
  title: string; icon: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-bg-1 border border-line rounded-[12px] overflow-hidden ${className ?? ""}`}>
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-line bg-bg-2">
        <Icon name={icon as Parameters<typeof Icon>[0]["name"]} size={13} className="text-fg-3" />
        <span className="text-[13px] font-semibold text-fg-0">{title}</span>
      </div>
      <div className="px-4 sm:px-5 py-4">{children}</div>
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-[5px] text-[12px] border-b border-dashed border-line last:border-0 gap-4">
      <span className="text-fg-2 shrink-0">{k}</span>
      <span className={`text-fg-0 text-right truncate ${mono ? "mono" : ""}`}>{v}</span>
    </div>
  );
}
