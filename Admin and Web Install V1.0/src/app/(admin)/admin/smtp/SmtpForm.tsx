"use client";
import { useState, useTransition, type FormEvent } from "react";
import { Button, Input, Label } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { saveSmtpSettings } from "./actions";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";

type SmtpFields = {
  host: string;
  port: string;
  user: string;
  pass: string;
  from: string;
  secure: string;
};

const PROVIDERS = [
  { name: "Gmail",      host: "smtp.gmail.com",                     port: "587", ssl: false, note: "Requires App Password" },
  { name: "Outlook",    host: "smtp.office365.com",                 port: "587", ssl: false, note: "Microsoft 365 / Outlook" },
  { name: "Yahoo",      host: "smtp.mail.yahoo.com",                port: "465", ssl: true,  note: "Requires App Password" },
  { name: "Mailgun",    host: "smtp.mailgun.org",                   port: "587", ssl: false, note: "Transactional email" },
  { name: "SendGrid",   host: "smtp.sendgrid.net",                  port: "587", ssl: false, note: "Use 'apikey' as username" },
  { name: "Amazon SES", host: "email-smtp.us-east-1.amazonaws.com", port: "587", ssl: false, note: "Region-specific host" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: 44,
        height: 24,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
        backgroundColor: checked ? "var(--accent)" : "#94a3b8",
        transition: "background-color 150ms ease",
        padding: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
          transform: checked ? "translateX(23px)" : "translateX(3px)",
          transition: "transform 150ms ease",
        }}
      />
    </button>
  );
}

function CardHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="px-4 sm:px-5 py-3.5 border-b border-line bg-bg-2 flex items-center gap-3">
      <div className="w-7 h-7 rounded-[7px] bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[13px] font-semibold text-fg-0">{title}</div>
        <div className="text-[11px] text-fg-3">{desc}</div>
      </div>
    </div>
  );
}

export function SmtpForm({ initial }: { initial: SmtpFields }) {
  const { t } = useT();
  const [host, setHost]     = useState(initial.host);
  const [port, setPort]     = useState(initial.port || "587");
  const [user, setUser]     = useState(initial.user);
  const [pass, setPass]     = useState(initial.pass);
  const [from, setFrom]     = useState(initial.from);
  const [secure, setSecure] = useState(initial.secure === "true");
  const [showPass, setShowPass] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [testError, setTestError]   = useState("");
  const [pending, startTransition]  = useTransition();

  const dirty =
    host !== initial.host ||
    port !== (initial.port || "587") ||
    user !== initial.user ||
    pass !== initial.pass ||
    from !== initial.from ||
    secure !== (initial.secure === "true");

  const isConfigured = !!initial.host && !!initial.user;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const id = toast.loading(t("adminSmtp.toastSaving"));
    startTransition(async () => {
      const res = await saveSmtpSettings({ host, port, user, pass, from, secure: secure ? "true" : "false" });
      if (res.ok) toast.resolve(id, "success", t("adminSmtp.toastSaved"));
      else toast.resolve(id, "error", res.error ?? t("adminSmtp.toastSaveFailed"));
    });
  }

  async function onSendTest() {
    setTestStatus("sending");
    setTestError("");
    const id = toast.loading(t("adminSmtp.toastSendingTest"));
    try {
      const res  = await fetch("/api/admin/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTestStatus("ok");
        toast.resolve(id, "success", t("adminSmtp.toastTestSent"), t("adminSmtp.toastTestSentDesc"));
      } else {
        setTestStatus("error");
        setTestError(data.error ?? t("adminSmtp.toastTestFailed"));
        toast.resolve(id, "error", t("adminSmtp.toastTestFailed"), data.error ?? t("adminSmtp.toastTestFailedDesc"));
      }
    } catch {
      setTestStatus("error");
      setTestError(t("adminSmtp.networkError"));
      toast.resolve(id, "error", t("adminSmtp.toastNetworkError"), t("adminSmtp.toastNetworkErrorDesc"));
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 sm:gap-6 items-start">

      {/* ── LEFT: server settings form ── */}
      <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
        <CardHeader
          icon={<Icon name="bolt" size={13} className="text-accent" />}
          title={t("adminSmtp.serverConnection")}
          desc={t("adminSmtp.serverConnectionDesc")}
        />
        <form onSubmit={onSubmit} className="p-4 sm:p-5 space-y-4">

          <div className="grid grid-cols-[1fr_96px] gap-3">
            <div className="space-y-1.5">
              <Label>{t("adminSmtp.labelSmtpHost")}</Label>
              <Input id="smtp-host" placeholder="smtp.example.com" value={host} onChange={(e) => setHost(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("adminSmtp.labelPort")}</Label>
              <Input id="smtp-port" placeholder="587" value={port} onChange={(e) => setPort(e.target.value)} />
            </div>
          </div>

          {/* TLS row */}
          <div className="flex items-center justify-between px-3.5 py-3 bg-bg-2 rounded-[8px] border border-line">
            <div className="flex items-center gap-2.5">
              <Icon name="lock" size={13} className="text-fg-3" />
              <div>
                <div className="text-[13px] font-medium text-fg-0 leading-tight">{t("adminSmtp.labelTls")}</div>
                <div className="text-[11px] text-fg-3 mt-0.5">{t("adminSmtp.tlsDesc")}</div>
              </div>
            </div>
            <Toggle checked={secure} onChange={() => setSecure((v) => !v)} />
          </div>

          {/* Authentication */}
          <div className="pt-3 border-t border-line">
            <div className="flex items-center gap-1.5 mb-3">
              <Icon name="user" size={11} className="text-fg-3" />
              <span className="text-[10px] font-semibold text-fg-3 uppercase tracking-[0.7px]">{t("adminSmtp.authentication")}</span>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t("adminSmtp.labelUsername")}</Label>
                <Input id="smtp-user" placeholder="user@example.com" value={user} onChange={(e) => setUser(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("adminSmtp.labelPassword")}</Label>
                <div className="relative">
                  <Input
                    id="smtp-pass"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg-1 transition-colors"
                    tabIndex={-1}
                    aria-label={showPass ? t("adminSmtp.hidePassword") : t("adminSmtp.showPassword")}
                  >
                    {showPass ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sender */}
          <div className="pt-3 border-t border-line">
            <div className="flex items-center gap-1.5 mb-3">
              <Icon name="mail" size={11} className="text-fg-3" />
              <span className="text-[10px] font-semibold text-fg-3 uppercase tracking-[0.7px]">{t("adminSmtp.sender")}</span>
            </div>
            <div className="space-y-1.5">
              <Label>{t("adminSmtp.labelFromAddress")}</Label>
              <Input id="smtp-from" placeholder="no-reply@example.com" value={from} onChange={(e) => setFrom(e.target.value)} />
              <p className="text-[11px] text-fg-3">{t("adminSmtp.fromAddressHint")}</p>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-[12px] text-fg-3 sm:hidden">
              {dirty ? t("adminSmtp.unsavedChanges") : t("adminSmtp.allChangesSaved")}
            </span>
            <Button type="submit" variant="primary" disabled={!dirty || pending} className="w-full sm:w-auto">
              {pending ? t("adminSmtp.saving") : t("adminSmtp.saveSettings")}
            </Button>
          </div>
        </form>
      </div>

      {/* ── RIGHT: status + test + quickfill + tips ── */}
      <div className="space-y-4">

        {/* Status */}
        <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
          <div className="px-4 py-3 border-b border-line bg-bg-2 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConfigured ? "bg-accent" : "bg-fg-3"}`} />
            <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-[0.6px]">{t("adminSmtp.statusTitle")}</span>
          </div>
          <div className="divide-y divide-line">
            {[
              {
                label: t("adminSmtp.configStatus"),
                value: isConfigured ? t("adminSmtp.configured") : t("adminSmtp.notSet"),
                accent: isConfigured,
              },
              { label: t("adminSmtp.encryption"), value: secure ? t("adminSmtp.tlsOn") : t("adminSmtp.tlsOff"), accent: secure },
              ...(initial.host  ? [{ label: t("adminSmtp.hostLabel"), value: initial.host,  mono: true, accent: false }] : []),
              ...(initial.port  ? [{ label: t("adminSmtp.portLabel"), value: initial.port,  mono: true, accent: false }] : []),
              ...(initial.from  ? [{ label: t("adminSmtp.fromLabel"), value: initial.from,  mono: false, accent: false }] : []),
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-[12px]">
                <span className="text-fg-2">{row.label}</span>
                <span className={`truncate max-w-[160px] text-right ${"mono" in row && row.mono ? "mono text-[11px]" : ""} ${row.accent ? "text-accent font-medium" : "text-fg-1"}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Test email */}
        <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
          <CardHeader
            icon={<Icon name="mail" size={13} className="text-accent" />}
            title={t("adminSmtp.testEmailTitle")}
            desc={t("adminSmtp.testEmailDesc")}
          />
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label>{t("adminSmtp.labelRecipient")}</Label>
              <Input
                id="smtp-test-to"
                placeholder="you@example.com"
                value={testTo}
                onChange={(e) => { setTestTo(e.target.value); setTestStatus("idle"); }}
              />
            </div>
            <Button
              type="button"
              variant="primary"
              disabled={testStatus === "sending" || !testTo}
              onClick={onSendTest}
              className="w-full"
            >
              {testStatus === "sending" ? t("adminSmtp.sending") : t("adminSmtp.sendTestEmail")}
            </Button>

            {testStatus === "ok" && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-[7px] border text-[12px]"
                style={{ background: "rgba(34,197,94,.08)", borderColor: "rgba(34,197,94,.25)", color: "rgb(22,163,74)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {t("adminSmtp.testSent")}
              </div>
            )}
            {testStatus === "error" && (
              <div className="px-3 py-2.5 rounded-[7px] border"
                style={{ background: "rgba(239,68,68,.08)", borderColor: "rgba(239,68,68,.25)" }}>
                <div className="flex items-center gap-2 text-[12px] font-medium" style={{ color: "rgb(220,38,38)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {t("adminSmtp.testFailed")}
                </div>
                {testError && <p className="mt-1 text-[11px] mono" style={{ color: "rgba(220,38,38,.75)" }}>{testError}</p>}
              </div>
            )}

            <p className="text-[11px] text-fg-3 leading-relaxed">
              {t("adminSmtp.savedConfigNote")}
            </p>
          </div>
        </div>

        {/* Quick fill */}
        <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
          <div className="px-4 py-3 border-b border-line bg-bg-2">
            <div className="text-[11px] font-semibold text-fg-3 uppercase tracking-[0.6px]">{t("adminSmtp.quickFillTitle")}</div>
            <div className="text-[11px] text-fg-3 mt-0.5">{t("adminSmtp.quickFillDesc")}</div>
          </div>
          <div className="p-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => { setHost(p.host); setPort(p.port); setSecure(p.ssl); }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[7px] hover:bg-bg-2 transition-colors text-left group"
              >
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-fg-0 group-hover:text-accent transition-colors leading-tight">{p.name}</div>
                  <div className="text-[10px] text-fg-3 truncate">{p.note}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] mono text-fg-1">{p.port}</div>
                  <div className="text-[10px] text-fg-3">{p.ssl ? "SSL" : "TLS"}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
          <div className="px-4 py-3 border-b border-line bg-bg-2">
            <div className="text-[11px] font-semibold text-fg-3 uppercase tracking-[0.6px]">{t("adminSmtp.tipsTitle")}</div>
          </div>
          <div className="p-4 space-y-3">
            {[
              { title: t("adminSmtp.tip1Title"), body: t("adminSmtp.tip1Body") },
              { title: t("adminSmtp.tip2Title"), body: t("adminSmtp.tip2Body") },
              { title: t("adminSmtp.tip3Title"), body: t("adminSmtp.tip3Body") },
            ].map((tip) => (
              <div key={tip.title} className="flex gap-2.5">
                <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <div className="text-[12px]">
                  <span className="font-medium text-fg-1">{tip.title} — </span>
                  <span className="text-fg-3">{tip.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
