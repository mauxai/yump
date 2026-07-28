"use client";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useT } from "@/lib/i18n";

const isDemo = process.env.NEXT_PUBLIC_IS_DEMO_MODE === "true";
const demoUserEmail = "user@user.com";
const demoUserPassword = "12345678";

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      className="text-fg-3 hover:text-fg-1 transition-colors"
      aria-label={show ? "Hide password" : "Show password"}
    >
      <Icon name={show ? "eyeOff" : "eye"} size={14} />
    </button>
  );
}

export function LoginForm({
  brandName = "the app",
  googleEnabled = false,
}: {
  brandName?: string;
  googleEnabled?: boolean;
}) {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await signIn("user-credentials", {
      email,
      password,
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setErr(t("auth.invalidCredentials"));
      return;
    }
    const callback = params.get("callbackUrl") || "/";
    router.replace(callback);
    router.refresh();
  }

  return (
    <>
      <div className="mb-7">
        <div className="text-[22px] font-semibold tracking-tight">{t("auth.welcomeBack")}</div>
        <div className="mt-[6px] text-[13px] text-fg-2">{t("auth.pickUpWhereLeft")}</div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-[10px]">
        <div>
          <Label>{t("auth.email")}</Label>
          <Input
            icon="mail"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-medium text-fg-1">{t("auth.password")}</span>
          </div>
          <Input
            icon="lock"
            type={showPass ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            suffix={<EyeToggle show={showPass} onToggle={() => setShowPass((v) => !v)} />}
          />
        </div>
        {err && <div className="text-[12px] text-[var(--danger)] mt-1">{err}</div>}
        <Button variant="primary" size="lg" type="submit" className="mt-2" disabled={busy}>
          {busy ? t("auth.signingIn") : t("auth.signIn")}
          {!busy && <Icon name="arrowRight" size={14} />}
        </Button>
      </form>

      <div className="mt-3 text-right">
        <Link
          href="/forgot-password"
          className="text-[12px] text-accent hover:underline"
        >
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
              <span className="font-mono text-fg-0">{demoUserEmail}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-fg-2">{t("auth.password")}</span>
              <span className="font-mono text-fg-0">{demoUserPassword}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setEmail(demoUserEmail); setPassword(demoUserPassword); }}
            className="w-full rounded-md bg-accent/15 px-3 py-1.5 text-[12px] font-medium text-accent hover:bg-accent/25 transition-colors"
          >
            {t("auth.autoFill")}
          </button>
        </div>
      )}

      {googleEnabled && (
        <>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-bg-1 px-2 text-fg-3">{t("auth.orContinueWith")}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full h-10 flex items-center justify-center gap-2.5 rounded-lg border border-line-2 bg-bg-1 hover:bg-bg-2 transition-colors text-[13px] font-medium text-fg-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t("auth.continueWithGoogle")}
          </button>
        </>
      )}

      <div className="mt-5 text-[12px] text-fg-2 text-center">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="text-accent font-medium hover:underline">
          {t("auth.signUp")}
        </Link>
      </div>
    </>
  );
}
