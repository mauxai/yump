"use client";

import { useState, useTransition, useRef, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Upload, ImageIcon } from "lucide-react";
import { GATEWAY_TYPES } from "@/lib/gateway-providers";
import { createGateway, updateGateway } from "./actions";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";

type KV = { key: string; value: string };

type InitialGateway = {
  id: string;
  name: string;
  type: string;
  mode: string;
  credentials: Record<string, string>;
  config: Record<string, string>;
};

function isSensitive(key: string) {
  return ["secret_key","api_key","auth_token","client_secret","webhook_secret",
    "store_pass","key_secret","password","api_secret"].some((s) => key.toLowerCase().includes(s));
}

function toKV(obj: Record<string, string>): KV[] {
  return Object.entries(obj).map(([key, value]) => ({ key, value }));
}

function fromKV(pairs: KV[]): Record<string, string> {
  return Object.fromEntries(pairs.filter((p) => p.key.trim()).map((p) => [p.key.trim(), p.value]));
}

function LogoUpload({
  value,
  onChange,
  onError,
}: {
  value: string;
  onChange: (v: string) => void;
  onError: (msg: string) => void;
}) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const hasImage = Boolean(value);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { onError(t("adminPayments.errorFileNotImage")); return; }
    if (file.size > 500_000) { onError(t("adminPayments.errorFileTooLarge")); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/gateway-image", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { onError(json.error ?? t("adminPayments.errorUploadFailed")); return; }
      onChange(json.path as string);
    } catch {
      onError(t("adminPayments.errorUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !hasImage && !uploading && inputRef.current?.click()}
      className={`relative flex items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
        uploading
          ? "border-line bg-bg-2 opacity-70 cursor-wait"
          : dragging
            ? "border-accent bg-accent/5"
            : hasImage
              ? "border-line bg-bg-2"
              : "border-line-2 bg-bg-2 hover:border-accent/60 hover:bg-accent/5 cursor-pointer"
      }`}
    >
      {/* Preview box */}
      <div className="shrink-0 w-16 h-16 rounded-xl bg-bg-3 border border-line-2 overflow-hidden flex items-center justify-center">
        {uploading ? (
          <svg className="animate-spin text-fg-3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        ) : hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${(process.env.NEXT_PUBLIC_STORAGE_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")}/storage/${value}`} alt="Logo" className="w-full h-full object-contain p-1" />
        ) : (
          <ImageIcon size={22} className="text-fg-4" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-fg-0">
          {uploading ? t("adminPayments.logoUploading") : hasImage ? t("adminPayments.logoUploaded") : t("adminPayments.logoDropUpload")}
        </div>
        <div className="text-[11px] text-fg-3 mt-0.5">{t("adminPayments.logoSpec")}</div>
      </div>

      {/* Actions */}
      {!uploading && hasImage ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-[6px] border border-line-2 bg-bg-1 text-[12px] text-fg-1 hover:bg-bg-3 transition-colors"
          >
            <Upload size={11} /> {t("adminPayments.changeBtn")}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="h-7 w-7 inline-flex items-center justify-center rounded-[6px] text-fg-3 hover:text-[var(--danger)] hover:bg-bg-3 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ) : !uploading ? (
        <div className="shrink-0 h-7 px-3 inline-flex items-center gap-1.5 rounded-[6px] border border-line-2 bg-bg-1 text-[12px] text-fg-2 pointer-events-none">
          <Upload size={11} /> Upload
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

function KVEditor({
  label,
  pairs,
  onChange,
}: {
  label: string;
  pairs: KV[];
  onChange: (pairs: KV[]) => void;
}) {
  const { t } = useT();
  function update(i: number, field: "key" | "value", val: string) {
    const next = pairs.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
    onChange(next);
  }
  function add() { onChange([...pairs, { key: "", value: "" }]); }
  function remove(i: number) { onChange(pairs.filter((_, idx) => idx !== i)); }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] font-medium text-fg-2 uppercase tracking-[0.5px]">{label}</div>
        <button
          type="button"
          onClick={add}
          className="h-6 px-2 inline-flex items-center gap-1 rounded-md border border-line-2 bg-bg-2 text-fg-2 text-[11px] hover:bg-bg-3 transition-colors"
        >
          <Plus size={10} /> {t("adminPayments.addField")}
        </button>
      </div>
      <div className="space-y-2">
        {pairs.map((p, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
            {/* Row 1 on mobile: key + delete */}
            <div className="flex items-center gap-1.5 sm:contents">
              <input
                value={p.key}
                onChange={(e) => update(i, "key", e.target.value)}
                placeholder="key"
                className="flex-1 sm:flex-none sm:w-[160px] sm:shrink-0 h-9 px-3 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[12px] mono outline-none focus:border-accent-line placeholder:text-fg-4"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="sm:hidden h-9 w-9 shrink-0 flex items-center justify-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-3 hover:text-[var(--danger)] hover:bg-bg-3 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
            {/* Row 2 on mobile: value */}
            <input
              value={p.value}
              onChange={(e) => update(i, "value", e.target.value)}
              type={isSensitive(p.key) ? "password" : "text"}
              placeholder={isSensitive(p.key) ? "••••••••" : "value"}
              className="flex-1 h-9 px-3 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[12px] mono outline-none focus:border-accent-line placeholder:text-fg-4"
            />
            {/* Delete on desktop only */}
            <button
              type="button"
              onClick={() => remove(i)}
              className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-3 hover:text-[var(--danger)] hover:bg-bg-3 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {pairs.length === 0 && (
          <div className="text-[12px] text-fg-4 italic py-2">{t("adminPayments.noFields")}</div>
        )}
      </div>
    </div>
  );
}

export function GatewayForm({ initial }: { initial?: InitialGateway }) {
  const { t } = useT();
  const router = useRouter();
  const isEdit = !!initial;
  const [pending, start] = useTransition();

  // Basic fields
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "payment");
  const [mode, setMode] = useState(initial?.mode ?? "live");

  // Separate gateway_title / gateway_image / storage from the rest of config
  const initConfigFull = initial?.config ?? {};
  const [gatewayTitle, setGatewayTitle] = useState(initConfigFull.gateway_title ?? "");
  const [gatewayImage, setGatewayImage] = useState(initConfigFull.gateway_image ?? "");
  const storage = initConfigFull.storage ?? "public";

  const otherConfigInit = toKV(
    Object.fromEntries(
      Object.entries(initConfigFull).filter(([k]) => !["gateway_title","gateway_image","storage"].includes(k))
    )
  );

  const [credentials, setCredentials] = useState<KV[]>(toKV(initial?.credentials ?? {}));
  const [config, setConfig] = useState<KV[]>(otherConfigInit);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) { toast.error(t("adminPayments.errorGatewayNameRequired")); return; }
    if (!gatewayTitle.trim()) { toast.error(t("adminPayments.errorGatewayTitleRequired")); return; }

    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("type", type);
    fd.set("mode", mode);

    // Pack credentials
    const credObj = fromKV(credentials);
    fd.set("credentials", JSON.stringify(credObj));

    // Pack config (merge meta + extra)
    const cfgObj = {
      gateway_title: gatewayTitle.trim(),
      gateway_image: gatewayImage.trim(),
      storage: storage.trim() || "public",
      ...fromKV(config),
    };
    fd.set("config", JSON.stringify(cfgObj));

    start(async () => {
      const res = isEdit
        ? await updateGateway(initial!.id, fd)
        : await createGateway(fd);
      if (!res.ok) toast.error(res.error);
      else router.push("/admin/third-party/payment");
    });
  }

  return (
    <div className="max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">
          {t("adminPayments.gwBreadcrumb")}
        </div>
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">
          {isEdit
            ? t("adminPayments.gwEditTitle").replace("{title}", initial!.config.gateway_title || initial!.name)
            : t("adminPayments.gwAddTitle")}
        </h1>
        <p className="text-[13px] text-fg-2 mt-1">
          {isEdit ? t("adminPayments.gwEditDesc") : t("adminPayments.gwAddDesc")}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 sm:gap-6">
          <div className="space-y-5">

            {/* Identity */}
            <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-line">
                <div className="text-[14px] font-semibold text-fg-0">{t("adminPayments.sectionIdentity")}</div>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-fg-1 mb-1.5">
                      {t("adminPayments.labelGatewayName")} <span className="text-[var(--danger)]">*</span>
                      <span className="text-fg-3 font-normal ml-1">{t("adminPayments.nameIdentifierHint")}</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isEdit}
                      placeholder="e.g. stripe, my-gateway"
                      className="w-full h-9 px-3 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] mono outline-none focus:border-accent-line placeholder:text-fg-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-fg-1 mb-1.5">
                      {t("adminPayments.labelDisplayTitle")} <span className="text-[var(--danger)]">*</span>
                    </label>
                    <input
                      value={gatewayTitle}
                      onChange={(e) => setGatewayTitle(e.target.value)}
                      placeholder="e.g. Stripe"
                      className="w-full h-9 px-3 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none focus:border-accent-line placeholder:text-fg-4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-fg-1 mb-1.5">{t("adminPayments.labelType")}</label>
                    <div className="flex items-center gap-1 p-1 bg-bg-2 rounded-lg border border-line-2">
                      {GATEWAY_TYPES.map((gt) => (
                        <button
                          key={gt.value}
                          type="button"
                          disabled={isEdit}
                          onClick={() => setType(gt.value)}
                          className={`flex-1 h-7 rounded-md text-[12px] font-medium transition-colors disabled:cursor-not-allowed ${
                            type === gt.value
                              ? "bg-bg-0 text-fg-0 shadow-sm border border-line"
                              : "text-fg-2 hover:text-fg-0"
                          }`}
                        >
                          {gt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-fg-1 mb-1.5">{t("adminPayments.labelMode")}</label>
                    <div className="flex items-center gap-1 p-1 bg-bg-2 rounded-lg border border-line-2">
                      {["live","test"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMode(m)}
                          className={`flex-1 h-7 rounded-md text-[12px] font-medium capitalize transition-colors ${
                            mode === m
                              ? "bg-bg-0 text-fg-0 shadow-sm border border-line"
                              : "text-fg-2 hover:text-fg-0"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-fg-1 mb-1.5">{t("adminPayments.labelLogo")}</label>
                  <LogoUpload
                    value={gatewayImage}
                    onChange={setGatewayImage}
                    onError={(msg) => toast.error(msg)}
                  />
                </div>
              </div>
            </section>

            {/* Credentials */}
            <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-line">
                <div className="text-[14px] font-semibold text-fg-0">{t("adminPayments.sectionCredentials")}</div>
                <div className="text-[12px] text-fg-3 mt-0.5">{t("adminPayments.credentialsDesc")}</div>
              </div>
              <div className="px-4 sm:px-6 py-5">
                <KVEditor label={t("adminPayments.credentialFields")} pairs={credentials} onChange={setCredentials} />
              </div>
            </section>

            {/* Extra config */}
            <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-line">
                <div className="text-[14px] font-semibold text-fg-0">{t("adminPayments.sectionExtraConfig")}</div>
                <div className="text-[12px] text-fg-3 mt-0.5">{t("adminPayments.extraConfigDesc")}</div>
              </div>
              <div className="px-4 sm:px-6 py-5">
                <KVEditor label={t("adminPayments.configFields")} pairs={config} onChange={setConfig} />
              </div>
            </section>

          </div>

          {/* Right info panel */}
          <div>
            <section className="rounded-xl border border-line bg-bg-1 overflow-hidden lg:sticky lg:top-6">
              <div className="px-4 sm:px-6 py-4 border-b border-line">
                <div className="text-[14px] font-semibold text-fg-0">{t("adminPayments.sectionDataFormat")}</div>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-3 text-[12px] text-fg-3">
                <p>{t("adminPayments.dataFormatDesc")}</p>
                <pre className="bg-bg-2 border border-line rounded-lg p-3 text-[10px] text-fg-1 overflow-auto leading-relaxed whitespace-pre-wrap break-all">{JSON.stringify({
                  gateway_title: gatewayTitle || "…",
                  gateway_image: gatewayImage || "…",
                  storage: storage,
                  "…extra": "fields",
                }, null, 2)}</pre>
                <p className="mt-3">{t("adminPayments.credentialsNote")}</p>
                <div className="mt-4 pt-4 border-t border-line space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    {credentials.length !== 1
                      ? t("adminPayments.credentialCountPlural").replace("{n}", String(credentials.length))
                      : t("adminPayments.credentialCount").replace("{n}", String(credentials.length))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    {config.length + 3 !== 1
                      ? t("adminPayments.configCountPlural").replace("{n}", String(config.length + 3))
                      : t("adminPayments.configCount").replace("{n}", String(config.length + 3))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="mt-6 sm:mt-8 flex items-center justify-between gap-4 sticky bottom-0 bg-bg-0/90 backdrop-blur-sm border-t border-line py-4 sm:py-5 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10">
          <div className="text-[12px] min-w-0 truncate hidden sm:block">
            <span className="text-fg-3">{t("adminPayments.credStoredSecurely")}</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
            <Link
              href="/admin/third-party/payment"
              className="flex-1 sm:flex-none h-10 sm:h-9 px-4 inline-flex items-center justify-center rounded-[6px] border border-line-2 bg-transparent text-fg-1 text-[13px] font-medium hover:bg-bg-2 transition-colors"
            >
              {t("adminPayments.cancel")}
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 sm:flex-none h-10 sm:h-9 px-4 inline-flex items-center justify-center rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending
                ? (isEdit ? t("adminPayments.saving") : t("adminPayments.adding"))
                : (isEdit ? t("adminPayments.saveChanges") : t("adminPayments.addGatewayBtn"))}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
