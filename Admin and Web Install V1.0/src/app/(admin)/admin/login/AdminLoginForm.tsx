"use client";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useT } from "@/lib/i18n";

const isDemo = process.env.NEXT_PUBLIC_IS_DEMO_MODE === "true";
const demoAdminEmail = "admin@admin.com";
const demoAdminPassword = "12345678";

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" tabIndex={-1} onClick={onToggle}
      className="text-fg-3 hover:text-fg-1 transition-colors" aria-label={show ? "Hide password" : "Show password"}>
      <Icon name={show ? "eyeOff" : "eye"} size={14} />
    </button>
  );
}

export function AdminLoginForm() {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await signIn("admin-credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setBusy(false);
      setErr(t("adminAuth.invalidCredentials"));
      return;
    }
    const callback = params.get("callbackUrl") || "/admin";
    router.replace(callback);
    router.refresh();
  }

  return (
    <>
      <div className="mb-7">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
            <Icon name="lock" size={10} />
            {t("adminAuth.badge")}
          </span>
        </div>
        <div className="mt-2 text-[22px] font-semibold tracking-tight">{t("adminAuth.title")}</div>
        <div className="mt-[6px] text-[13px] text-fg-2">{t("adminAuth.subtitle")}</div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-[10px]">
        <div>
          <Label>{t("auth.email")}</Label>
          <Input
            icon="mail"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label>{t("auth.password")}</Label>
          <Input
            icon="lock"
            type={showPass ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            suffix={<EyeToggle show={showPass} onToggle={() => setShowPass(v => !v)} />}
          />
        </div>
        {err && <div className="text-[12px] text-[var(--danger)] mt-1">{err}</div>}
        <Button variant="primary" size="lg" type="submit" className="mt-2" disabled={busy}>
          {busy ? t("auth.signingIn") : t("auth.signIn")}
          {!busy && <Icon name="arrowRight" size={14} />}
        </Button>
      </form>

      <div className="mt-3 text-end">
        <Link href="/forgot-password" className="text-[12px] text-accent hover:underline">
          {t("auth.forgotPassword")}
        </Link>
      </div>

      {isDemo && (
        <div className="mt-5 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            <Icon name="bolt" size={11} />
            {t("auth.demoCredentials")}
          </div>
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-fg-2">{t("auth.email")}</span>
              <span className="font-mono text-fg-0">{demoAdminEmail}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-fg-2">{t("auth.password")}</span>
              <span className="font-mono text-fg-0">{demoAdminPassword}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setEmail(demoAdminEmail); setPassword(demoAdminPassword); }}
            className="w-full rounded-md bg-accent/15 px-3 py-1.5 text-[12px] font-medium text-accent hover:bg-accent/25 transition-colors"
          >
            {t("adminAuth.autoFill")}
          </button>
        </div>
      )}
    </>
  );
}
