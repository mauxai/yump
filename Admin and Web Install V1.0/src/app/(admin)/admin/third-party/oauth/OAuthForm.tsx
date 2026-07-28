"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { toast } from "@/lib/toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useT } from "@/lib/i18n";

type Props = {
  initial: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
  };
  appUrl: string;
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export function OAuthForm({ initial, appUrl }: Props) {
  const { t } = useT();
  const router = useRouter();
  const callbackUrl = `${appUrl}/api/auth/callback/google`;

  const [enabled, setEnabled] = useState(initial.enabled);
  const [clientId, setClientId] = useState(initial.clientId);
  const [clientSecret, setClientSecret] = useState(initial.clientSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  async function save(overrides?: { enabled?: boolean }) {
    const payload = {
      provider: "google",
      enabled: overrides?.enabled ?? enabled,
      clientId,
      clientSecret,
    };
    setBusy(true);
    const tid = toast.loading(t("adminOAuth.toastSaving"));
    try {
      const res = await fetch("/api/admin/oauth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("adminOAuth.toastSaving"));
      toast.resolve(tid, "success", t("adminOAuth.toastSaved"));
      router.refresh();
    } catch (e) {
      toast.resolve(tid, "error", e instanceof Error ? e.message : t("adminOAuth.toastSaving"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

      {/* ── Left column ─────────────────────────────────────── */}
      <div className="flex flex-col gap-5">

        {/* Provider card */}
        <div className="rounded-xl border border-line bg-bg-1 overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-line">
            {/* Top row: icon + name + toggle */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-line bg-bg-0 flex items-center justify-center shrink-0 shadow-sm">
                <GoogleIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-fg-0">{t("adminOAuth.googleOAuthTitle")}</div>
                <div className="text-[12px] text-fg-3 mt-0.5 hidden sm:block">{t("adminOAuth.googleOAuthDesc")}</div>
              </div>
              {/* Status badge — desktop only */}
              <span className={`hidden sm:inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium border ${
                enabled
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-bg-3 text-fg-3 border-line-2"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-emerald-500" : "bg-fg-4"}`} />
                {enabled ? t("adminOAuth.statusEnabled") : t("adminOAuth.statusDisabled")}
              </span>
              {/* Toggle */}
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
            {/* Mobile: desc + status badge */}
            <div className="sm:hidden flex items-center justify-between gap-2 mt-2 ml-[48px]">
              <div className="text-[12px] text-fg-3 leading-snug">{t("adminOAuth.googleOAuthDesc")}</div>
              <span className={`shrink-0 inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-medium border ${
                enabled
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-bg-3 text-fg-3 border-line-2"
              }`}>
                <span className={`w-1 h-1 rounded-full ${enabled ? "bg-emerald-500" : "bg-fg-4"}`} />
                {enabled ? t("adminOAuth.statusEnabled") : t("adminOAuth.statusDisabled")}
              </span>
            </div>
          </div>

          {/* Credentials */}
          <div className="px-4 sm:px-6 py-5 flex flex-col gap-4">
            <div>
              <Label>{t("adminOAuth.labelClientId")}</Label>
              <Input
                type="text"
                placeholder="your-client-id.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={busy}
                className="w-full font-mono text-[12px]"
              />
            </div>
            <div>
              <Label>{t("adminOAuth.labelClientSecret")}</Label>
              <Input
                type={showSecret ? "text" : "password"}
                placeholder={initial.clientSecret ? t("adminOAuth.secretPlaceholderChange") : "GOCSPX-…"}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                disabled={busy}
                className="w-full font-mono text-[12px]"
                suffix={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowSecret((v) => !v)}
                    className="text-fg-3 hover:text-fg-1 transition-colors"
                    aria-label={showSecret ? t("adminOAuth.hideSecret") : t("adminOAuth.showSecret")}
                  >
                    <Icon name={showSecret ? "eyeOff" : "eye"} size={14} />
                  </button>
                }
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
              <Button variant="primary" onClick={() => save()} disabled={busy} className="w-full sm:w-auto">
                {busy ? t("adminOAuth.saving") : t("adminOAuth.saveCredentials")}
              </Button>
              <span className="text-[11px] text-fg-3 sm:text-right">{t("adminOAuth.changesOnNextSignIn")}</span>
            </div>
          </div>
        </div>

        {/* Callback URL */}
        <div className="rounded-xl border border-line bg-bg-1 px-4 sm:px-6 py-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
              <Icon name="bolt" size={12} className="text-accent" />
            </div>
            <span className="text-[13px] font-semibold text-fg-0">{t("adminOAuth.authorizedRedirectUri")}</span>
          </div>
          <p className="text-[12px] text-fg-2 leading-relaxed">
            {t("adminOAuth.redirectUriDesc")}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-bg-2 border border-line-2 px-3 py-2.5 text-[12px] font-mono text-fg-0 truncate">
              {callbackUrl}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(callbackUrl).catch(() => {});
                toast.success(t("adminOAuth.copied"));
              }}
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-line-2 bg-bg-2 hover:bg-bg-3 transition-colors text-fg-2 hover:text-fg-0"
              title="Copy"
            >
              <CopyIcon />
            </button>
          </div>
        </div>
      </div>

      {/* ── Right column — Setup guide ───────────────────────── */}
      <div className="flex flex-col gap-4">

        {/* Steps */}
        <div className="rounded-xl border border-line bg-bg-1 px-4 sm:px-5 py-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-[#4285F4]/10 flex items-center justify-center">
              <GoogleIcon />
            </div>
            <span className="text-[13px] font-semibold text-fg-0">{t("adminOAuth.setupGuide")}</span>
          </div>

          {[
            { n: 1, title: t("adminOAuth.step1Title"), body: t("adminOAuth.step1Body") },
            { n: 2, title: t("adminOAuth.step2Title"), body: t("adminOAuth.step2Body") },
            { n: 3, title: t("adminOAuth.step3Title"), body: t("adminOAuth.step3Body") },
            { n: 4, title: t("adminOAuth.step4Title"), body: t("adminOAuth.step4Body") },
            { n: 5, title: t("adminOAuth.step5Title"), body: t("adminOAuth.step5Body") },
            { n: 6, title: t("adminOAuth.step6Title"), body: t("adminOAuth.step6Body") },
          ].map((s) => (
            <div key={s.n} className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-accent">{s.n}</span>
              </div>
              <div>
                <div className="text-[12px] font-semibold text-fg-0">{s.title}</div>
                <div className="text-[11px] text-fg-3 mt-0.5 leading-relaxed">{s.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="rounded-xl border border-line bg-bg-1 px-5 py-4 flex flex-col gap-2">
          <div className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.6px]">{t("adminOAuth.whatHappensTitle")}</div>
          <ul className="flex flex-col gap-1.5 text-[11px] text-fg-3 leading-relaxed">
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span> {t("adminOAuth.bullet1")}</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span> {t("adminOAuth.bullet2")}</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span> {t("adminOAuth.bullet3")}</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span> {t("adminOAuth.bullet4")}</li>
          </ul>
        </div>
      </div>

      <ConfirmDialog
        open={confirmToggle}
        title={enabled ? t("adminOAuth.confirmDisableTitle") : t("adminOAuth.confirmEnableTitle")}
        description={
          enabled
            ? t("adminOAuth.confirmDisableDesc")
            : t("adminOAuth.confirmEnableDesc")
        }
        confirmLabel={enabled ? t("adminOAuth.disable") : t("adminOAuth.enable")}
        cancelLabel={t("adminOAuth.cancel")}
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
