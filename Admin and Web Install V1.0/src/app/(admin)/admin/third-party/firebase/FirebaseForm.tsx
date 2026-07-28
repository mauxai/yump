"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { toast } from "@/lib/toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useT } from "@/lib/i18n";

const FirebaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden>
    <path d="M6 26L11.5 4l7 12.5L22 8l4 18H6z" fill="#FFA000" />
    <path d="M6 26l5.5-9.5 7 4.5L22 8l4 18H6z" fill="#F57C00" />
    <path d="M18.5 21l-7-4.5L6 26h20l-7.5-5z" fill="#FFCA28" />
  </svg>
);

export type FirebaseInitial = {
  enabled:           boolean;
  // Server-side (Admin SDK)
  projectId:         string;
  clientEmail:       string;
  privateKey:        string;
  vapidKey:          string;
  // Client SDK
  apiKey:            string;
  authDomain:        string;
  storageBucket:     string;
  messagingSenderId: string;
  appId:             string;
  measurementId:     string;
};

export function FirebaseForm({ initial }: { initial: FirebaseInitial }) {
  const { t } = useT();
  const router = useRouter();

  const [enabled,           setEnabled]           = useState(initial.enabled);
  const [projectId,         setProjectId]         = useState(initial.projectId);
  const [clientEmail,       setClientEmail]       = useState(initial.clientEmail);
  const [privateKey,        setPrivateKey]        = useState(initial.privateKey);
  const [vapidKey,          setVapidKey]          = useState(initial.vapidKey);
  const [apiKey,            setApiKey]            = useState(initial.apiKey);
  const [authDomain,        setAuthDomain]        = useState(initial.authDomain);
  const [storageBucket,     setStorageBucket]     = useState(initial.storageBucket);
  const [messagingSenderId, setMessagingSenderId] = useState(initial.messagingSenderId);
  const [appId,             setAppId]             = useState(initial.appId);
  const [measurementId,     setMeasurementId]     = useState(initial.measurementId);
  const [showKey,       setShowKey]       = useState(false);
  const [busy,          setBusy]          = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  // Fetch the real private key on mount so the blurred textarea shows full content
  useEffect(() => {
    fetch("/api/admin/firebase/reveal")
      .then((r) => r.json())
      .then((data) => { if (data.value) setPrivateKey(data.value); })
      .catch(() => {});
  }, []);

  async function save(overrides?: { enabled?: boolean }) {
    setBusy(true);
    const tid = toast.loading(t("adminFirebase.savingMsg"));
    try {
      const res = await fetch("/api/admin/firebase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: overrides?.enabled ?? enabled,
          projectId, clientEmail, privateKey, vapidKey,
          apiKey, authDomain, storageBucket, messagingSenderId, appId, measurementId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.resolve(tid, "success", t("adminFirebase.savedOk"));
      router.refresh();
    } catch (e) {
      toast.resolve(tid, "error", e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

      {/* ── Left column ─────────────────────────────────────── */}
      <div className="flex flex-col gap-5">

        {/* ── Card header with toggle ── */}
        <div className="rounded-xl border border-line bg-bg-1 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-line bg-bg-0 flex items-center justify-center shrink-0 shadow-sm">
                <FirebaseIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-fg-0">{t("adminFirebase.cardTitle")}</div>
                <div className="text-[12px] text-fg-3 mt-0.5 hidden sm:block">
                  {t("adminFirebase.cardSubtitle")}
                </div>
              </div>
              <span className={`hidden sm:inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium border ${
                enabled
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-bg-3 text-fg-3 border-line-2"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-emerald-500" : "bg-fg-4"}`} />
                {enabled ? t("adminFirebase.enabled") : t("adminFirebase.disabled")}
              </span>
              <button
                type="button"
                dir="ltr"
                role="switch"
                aria-checked={enabled}
                onClick={() => setConfirmToggle(true)}
                className={`relative inline-flex h-6 w-11 sm:h-5 sm:w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                  enabled ? "bg-accent" : "bg-bg-3"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 sm:h-4 sm:w-4 rounded-full bg-white shadow transform transition-transform ${
                  enabled ? "translate-x-5 sm:translate-x-4" : "translate-x-0"
                }`} />
              </button>
            </div>
            <div className="sm:hidden flex items-center justify-between gap-2 mt-2 ml-[48px]">
              <div className="text-[12px] text-fg-3 leading-snug">{t("adminFirebase.cardSubtitle")}</div>
              <span className={`shrink-0 inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-medium border ${
                enabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-bg-3 text-fg-3 border-line-2"
              }`}>
                <span className={`w-1 h-1 rounded-full ${enabled ? "bg-emerald-500" : "bg-fg-4"}`} />
                {enabled ? t("adminFirebase.enabled") : t("adminFirebase.disabled")}
              </span>
            </div>
          </div>

          {/* ── Section 1: Server-side credentials (Admin SDK) ── */}
          <div className="px-4 sm:px-6 pt-5 pb-4 flex flex-col gap-4 border-b border-line">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-accent" />
              <span className="text-[12px] font-semibold text-fg-1 uppercase tracking-[0.5px]">{t("adminFirebase.sectionServer")}</span>
              <span className="text-[11px] text-fg-4">({t("adminFirebase.sectionServerDesc")})</span>
            </div>

            <div>
              <Label>{t("adminFirebase.projectId")}</Label>
              <Input
                type="text"
                placeholder="my-firebase-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={busy}
                className="w-full font-mono text-[12px]"
              />
            </div>

            <div>
              <Label>{t("adminFirebase.clientEmail")} <span className="text-fg-4 font-normal">({t("adminFirebase.clientEmailNote")})</span></Label>
              <Input
                type="text"
                placeholder="firebase-adminsdk-xxxx@my-project.iam.gserviceaccount.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                disabled={busy}
                className="w-full font-mono text-[12px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>{t("adminFirebase.privateKey")} <span className="text-fg-4 font-normal">({t("adminFirebase.privateKeyNote")})</span></Label>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowKey((v) => !v)}
                  className="flex items-center gap-1 text-[11px] text-fg-3 hover:text-fg-1 transition-colors"
                >
                  <Icon name={showKey ? "eyeOff" : "eye"} size={13} />
                  {showKey ? t("adminFirebase.hide") : t("adminFirebase.show")}
                </button>
              </div>
              <textarea
                rows={5}
                placeholder={initial.privateKey ? "Leave blank to keep existing key" : "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0B…\n-----END PRIVATE KEY-----"}
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                disabled={busy}
                className={`w-full rounded-lg border border-line bg-bg-0 px-3 py-2.5 font-mono text-[11px] text-fg-0 placeholder:text-fg-4 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 transition ${showKey ? "" : "[filter:blur(3px)] select-none"}`}
              />
            </div>

            <div>
              <Label>{t("adminFirebase.vapidKey")} <span className="text-fg-4 font-normal">({t("adminFirebase.vapidKeyNote")})</span></Label>
              <Input
                type="text"
                placeholder={t("adminFirebase.vapidKeyPlaceholder")}
                value={vapidKey}
                onChange={(e) => setVapidKey(e.target.value)}
                disabled={busy}
                className="w-full font-mono text-[12px]"
              />
            </div>
          </div>

          {/* ── Section 2: Client SDK config ── */}
          <div className="px-4 sm:px-6 pt-5 pb-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-[#FFA000]" />
              <span className="text-[12px] font-semibold text-fg-1 uppercase tracking-[0.5px]">{t("adminFirebase.sectionClient")}</span>
              <span className="text-[11px] text-fg-4">({t("adminFirebase.sectionClientDesc")} <code className="bg-bg-2 px-1 rounded">GET /api/v1/firebase/config</code>)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("adminFirebase.apiKey")}</Label>
                <Input
                  type="text"
                  placeholder="AIzaSy…"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={busy}
                  className="w-full font-mono text-[12px]"
                />
              </div>

              <div>
                <Label>{t("adminFirebase.authDomain")}</Label>
                <Input
                  type="text"
                  placeholder="my-project.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  disabled={busy}
                  className="w-full font-mono text-[12px]"
                />
              </div>

              <div>
                <Label>{t("adminFirebase.storageBucket")}</Label>
                <Input
                  type="text"
                  placeholder="my-project.firebasestorage.app"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  disabled={busy}
                  className="w-full font-mono text-[12px]"
                />
              </div>

              <div>
                <Label>{t("adminFirebase.messagingSenderId")}</Label>
                <Input
                  type="text"
                  placeholder="689973750512"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  disabled={busy}
                  className="w-full font-mono text-[12px]"
                />
              </div>

              <div>
                <Label>{t("adminFirebase.appId")}</Label>
                <Input
                  type="text"
                  placeholder="1:000000000000:web:xxxxxxxxxxxxxxxx"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  disabled={busy}
                  className="w-full font-mono text-[12px]"
                />
              </div>

              <div>
                <Label>{t("adminFirebase.measurementId")} <span className="text-fg-4 font-normal">({t("adminFirebase.measurementIdNote")})</span></Label>
                <Input
                  type="text"
                  placeholder="G-XXXXXXXXXX"
                  value={measurementId}
                  onChange={(e) => setMeasurementId(e.target.value)}
                  disabled={busy}
                  className="w-full font-mono text-[12px]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
              <Button variant="primary" onClick={() => save()} disabled={busy} className="w-full sm:w-auto">
                {busy ? t("adminFirebase.saving") : t("adminFirebase.saveAll")}
              </Button>
              <span className="text-[11px] text-fg-3 sm:text-right">
                {t("adminFirebase.keyNeverExposed")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right column — Setup guide ───────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-line bg-bg-1 px-4 sm:px-5 py-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-[#FFA000]/10 flex items-center justify-center">
              <FirebaseIcon />
            </div>
            <span className="text-[13px] font-semibold text-fg-0">{t("adminFirebase.guideTitle")}</span>
          </div>

          {([1, 2, 3, 4, 5, 6] as const).map((n) => (
            <div key={n} className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-accent">{n}</span>
              </div>
              <div>
                <div className="text-[12px] font-semibold text-fg-0">{t(`adminFirebase.guide${n}Title`)}</div>
                <div className="text-[11px] text-fg-3 mt-0.5 leading-relaxed">{t(`adminFirebase.guide${n}Body`)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-line bg-bg-1 px-5 py-4 flex flex-col gap-2">
          <div className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.6px]">{t("adminFirebase.whatTitle")}</div>
          <ul className="flex flex-col gap-1.5 text-[11px] text-fg-3 leading-relaxed">
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span> {t("adminFirebase.what1")}</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span> {t("adminFirebase.what2")} <code className="text-fg-1 bg-bg-2 px-1 rounded">GET /api/v1/firebase/config</code></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span> {t("adminFirebase.what3")} <code className="text-fg-1 bg-bg-2 px-1 rounded">POST /api/v1/push/register</code></li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span> {t("adminFirebase.what4")}</li>
          </ul>
        </div>
      </div>

      <ConfirmDialog
        open={confirmToggle}
        title={enabled ? t("adminFirebase.confirmDisableTitle") : t("adminFirebase.confirmEnableTitle")}
        description={enabled ? t("adminFirebase.confirmDisableDesc") : t("adminFirebase.confirmEnableDesc")}
        confirmLabel={enabled ? t("adminFirebase.disableLabel") : t("adminFirebase.enableLabel")}
        cancelLabel={t("common.cancel")}
        variant={enabled ? "danger" : "warning"}
        icon={enabled ? "close" : "bolt"}
        onConfirm={() => {
          const next = !enabled;
          setEnabled(next);
          setConfirmToggle(false);
          save({ enabled: next });
        }}
        onCancel={() => setConfirmToggle(false)}
      />
    </div>
  );
}
