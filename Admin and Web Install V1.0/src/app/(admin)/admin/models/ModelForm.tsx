"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronDown, Info } from "lucide-react";
import { getProviderList, getModelsForProvider, getCredentialFields } from "@/lib/ai-providers";
import { useT } from "@/lib/i18n";
import type { ModelResult } from "./actions";

type FormValues = {
  label: string;
  provider: string;
  modelId: string;
  credentials: Record<string, string>;
  notes: string;
  isActive: boolean;
  isDefault: boolean;
  creditCost: number;
};

type Props = {
  initial?: Partial<FormValues>;
  action: (fd: FormData) => Promise<ModelResult>;
  submitLabel: string;
};

const PROVIDERS = getProviderList();

export function ModelForm({ initial, action, submitLabel }: Props) {
  const router = useRouter();
  const { t } = useT();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [provider, setProvider] = useState(initial?.provider ?? "");
  const [modelId, setModelId] = useState(initial?.modelId ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [credentials, setCredentials] = useState<Record<string, string>>(
    initial?.credentials ?? {}
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [creditCost, setCreditCost] = useState(initial?.creditCost ?? 1);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const models = provider ? getModelsForProvider(provider) : [];
  const credFields = provider ? getCredentialFields(provider) : [];

  function handleProviderChange(val: string) {
    setProvider(val);
    setModelId("");
    setCredentials({});
    setShowKeys({});
    // Auto-fill label with provider name if empty
    if (!label) {
      const pName = PROVIDERS.find((p) => p.id === val)?.name ?? val;
      setLabel(pName);
    }
  }

  function handleModelChange(val: string) {
    setModelId(val);
    const pName = PROVIDERS.find((p) => p.id === provider)?.name ?? provider;
    const mLabel = models.find((m) => m.id === val)?.label ?? val;
    if (!label || label === pName) {
      setLabel(`${pName} · ${mLabel}`);
    }
  }

  function setCred(key: string, val: string) {
    setCredentials((prev) => ({ ...prev, [key]: val }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("label", label);
    fd.set("provider", provider);
    fd.set("modelId", modelId);
    fd.set("notes", notes);
    fd.set("isActive", isActive ? "1" : "0");
    fd.set("isDefault", isDefault ? "1" : "0");
    fd.set("creditCost", String(creditCost));
    for (const [k, v] of Object.entries(credentials)) {
      fd.set(`cred_${k}`, v);
    }
    start(async () => {
      const res = await action(fd);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* ── Provider + Model ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("adminModels.fieldProvider")}>
          <SelectInput
            value={provider}
            onChange={handleProviderChange}
            required
          >
            <option value="">{t("adminModels.selectProvider")}</option>
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </SelectInput>
        </Field>

        <Field label={t("adminModels.fieldModel")}>
          <SelectInput
            value={modelId}
            onChange={handleModelChange}
            required
            disabled={!provider}
          >
            <option value="">{provider ? t("adminModels.selectModel") : t("adminModels.selectProviderFirst")}</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </SelectInput>
        </Field>
      </div>

      {/* ── Display label ────────────────────────────── */}
      <Field label={t("adminModels.displayLabel")}>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          maxLength={120}
          placeholder={t("adminModels.labelPlaceholder")}
          className="w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] px-3 outline-none focus:border-accent-line"
        />
        <FieldHint>{t("adminModels.labelHint")}</FieldHint>
      </Field>

      {/* ── Dynamic credential fields ─────────────────── */}
      {credFields.length > 0 && (
        <div className="rounded-[8px] border border-line-2 bg-bg-2/50 p-4 space-y-4">
          <div className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.5px]">
            {t("adminModels.credentials")}
          </div>

          {credFields.map((field) => {
            const val = credentials[field.key] ?? "";
            const show = showKeys[field.key] ?? false;
            const inputType = field.type === "password" ? (show ? "text" : "password") : field.type;

            return (
              <Field key={field.key} label={field.label} optional={!field.required} optionalLabel={t("adminModels.optional")}>
                <div className="relative">
                  <input
                    type={inputType}
                    value={val}
                    onChange={(e) => setCred(field.key, e.target.value)}
                    required={field.required}
                    placeholder={field.placeholder ?? `${field.envName}`}
                    autoComplete="off"
                    className={`w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] pl-3 outline-none focus:border-accent-line ${
                      field.type === "password" ? "pr-9 font-mono" : "pr-3"
                    }`}
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowKeys((s) => ({ ...s, [field.key]: !show }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg-0"
                    >
                      {show ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  )}
                </div>
                <FieldHint>
                  <span className="inline-flex items-center gap-1">
                    <Info size={10} />
                    {t("adminModels.envFallback")}&nbsp;<code className="mono text-[10px]">{field.envName}</code>
                    {field.hint && <> · {field.hint}</>}
                  </span>
                </FieldHint>
              </Field>
            );
          })}
        </div>
      )}

      {/* ── Notes ────────────────────────────────────── */}
      <Field label={t("adminModels.notes")} optional optionalLabel={t("adminModels.optional")}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={t("adminModels.notesPlaceholder")}
          className="w-full rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] px-3 py-2 outline-none focus:border-accent-line resize-none"
        />
      </Field>

      {/* ── Credit cost ──────────────────────────────── */}
      <Field label={t("adminModels.kvCreditCost")}>
        <input
          type="number"
          value={creditCost}
          onChange={(e) => setCreditCost(Math.max(1, parseInt(e.target.value, 10) || 1))}
          min={1}
          step={1}
          required
          className="w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] px-3 outline-none focus:border-accent-line"
        />
        <FieldHint>{t("adminModels.creditHint")}</FieldHint>
      </Field>

      {/* ── Toggles ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <Toggle
          id="isActive"
          label={t("adminModels.activeToggleLabel")}
          description={t("adminModels.activeToggleDesc")}
          checked={isActive}
          onChange={setIsActive}
        />
        <Toggle
          id="isDefault"
          label={t("adminModels.defaultToggleLabel")}
          description={t("adminModels.defaultToggleDesc")}
          checked={isDefault}
          onChange={setIsDefault}
        />
      </div>

      {error && (
        <div className="text-[12px] text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-[6px] px-3 py-2">
          {error}
        </div>
      )}

      {/* ── Actions ──────────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/admin/models")}
          disabled={pending}
          className="h-10 sm:h-9 px-4 rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[13px] hover:bg-bg-3 transition-colors text-center"
        >
          {t("adminModels.cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-10 sm:h-9 px-5 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 sm:order-first"
        >
          {pending ? t("adminModels.saving") : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ── Shared small components ──────────────────────────── */

function Field({
  label,
  optional,
  optionalLabel,
  children,
}: {
  label: string;
  optional?: boolean;
  optionalLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-fg-1 mb-1.5">
        {label}
        {optional && <span className="ml-1 text-fg-3 font-normal">{optionalLabel ?? "optional"}</span>}
      </label>
      {children}
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-fg-3 mt-1 flex items-center gap-1">{children}</div>;
}

function SelectInput({
  value,
  onChange,
  required,
  disabled,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] pl-3 pr-8 appearance-none outline-none focus:border-accent-line disabled:opacity-50"
      >
        {children}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-3"
      />
    </div>
  );
}

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
      <div className="relative mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-9 h-5 rounded-full transition-colors ${checked ? "bg-accent" : "bg-bg-3 border border-line-2"}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </div>
      <div>
        <div className="text-[13px] font-medium text-fg-0">{label}</div>
        <div className="text-[11px] text-fg-3">{description}</div>
      </div>
    </label>
  );
}
