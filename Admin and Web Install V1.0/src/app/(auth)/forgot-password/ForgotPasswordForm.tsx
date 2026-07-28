"use client";
import { useRef, useState, type FormEvent, type KeyboardEvent, type ClipboardEvent } from "react";
import Link from "next/link";
import { Button, Input, Label } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" tabIndex={-1} onClick={onToggle}
      className="text-fg-3 hover:text-fg-1 transition-colors" aria-label={show ? "Hide" : "Show"}>
      <Icon name={show ? "eyeOff" : "eye"} size={14} />
    </button>
  );
}

function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(i: number, ch: string) {
    const digit = ch.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...value];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    onChange(next);
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={[
            "w-11 h-13 text-center text-[20px] font-semibold rounded-[10px] border outline-none transition-all",
            "bg-bg-1 text-fg-0",
            value[i]
              ? "border-accent ring-2 ring-accent/20"
              : "border-line focus:border-accent focus:ring-2 focus:ring-accent/20",
          ].join(" ")}
          style={{ height: 52 }}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}

type Step = "email" | "otp" | "password";

export function ForgotPasswordForm() {
  const { t } = useT();
  const loginUrlRef = useRef<string>("/login");

  const [step, setStep]         = useState<Step>("email");
  const [email, setEmail]       = useState("");
  const [digits, setDigits]     = useState<string[]>(Array(6).fill(""));
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [done, setDone]         = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function onSendOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const id = toast.loading("Sending verification code…");
    const res = await fetch("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      toast.resolve(id, "error", "Failed to send", data.error || "Something went wrong.");
      return;
    }
    toast.resolve(id, "success", "Code sent!", "Check your inbox.");
    setStep("otp");
    startResendCooldown();
  }

  function startResendCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) { clearInterval(interval); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  async function onResend() {
    if (resendCooldown > 0) return;
    setBusy(true);
    const id = toast.loading("Resending code…");
    const res = await fetch("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (res.ok) {
      toast.resolve(id, "success", "New code sent!", "Check your inbox.");
      setDigits(Array(6).fill(""));
      startResendCooldown();
    } else {
      toast.resolve(id, "error", "Failed to resend", "Please try again.");
    }
  }

  async function onVerifyOtp(e: FormEvent) {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6) {
      toast.error("Enter all 6 digits.");
      return;
    }
    setBusy(true);
    const id = toast.loading("Verifying code…");
    const res = await fetch("/api/v1/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      toast.resolve(id, "error", "Invalid code", data.error || "Please try again.");
      setDigits(Array(6).fill(""));
      return;
    }
    toast.resolve(id, "success", "Code verified!");
    setResetToken(data.token);
    loginUrlRef.current = data.kind === "admin" ? "/admin/login" : "/login";
    setStep("password");
  }

  async function onResetPassword(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t("auth.passwordsNoMatch"));
      return;
    }
    setBusy(true);
    const id = toast.loading("Updating password…");
    const res = await fetch("/api/v1/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      toast.resolve(id, "error", "Failed to reset", data.error || "Something went wrong.");
      return;
    }
    toast.resolve(id, "success", "Password updated!", "Redirecting you to sign in…");
    setDone(true);
    setTimeout(() => { window.location.href = loginUrlRef.current; }, 2500);
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div className="text-[20px] font-semibold tracking-tight mb-2">{t("auth.passwordUpdated")}</div>
        <p className="text-[13px] text-fg-2">{t("auth.redirectingToSignIn")}</p>
      </div>
    );
  }

  const steps: Step[] = ["email", "otp", "password"];
  const stepIdx = steps.indexOf(step);

  return (
    <>
      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 mb-7">
        {steps.map((s, i) => (
          <div key={s} className={[
            "h-1.5 rounded-full transition-all duration-300",
            i === stepIdx ? "w-6 bg-accent" : i < stepIdx ? "w-3 bg-accent/40" : "w-3 bg-line",
          ].join(" ")} />
        ))}
      </div>

      {/* Step 1: Email */}
      {step === "email" && (
        <>
          <div className="mb-7">
            <div className="text-[22px] font-semibold tracking-tight">{t("auth.forgotPasswordTitle")}</div>
            <div className="mt-[6px] text-[13px] text-fg-2">{t("auth.forgotPasswordHint")}</div>
          </div>
          <form onSubmit={onSendOtp} className="flex flex-col gap-[10px]">
            <div>
              <Label>{t("auth.email")}</Label>
              <Input
                icon="mail"
                type="email"
                required
                autoComplete="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button variant="primary" size="lg" type="submit" className="mt-2" disabled={busy}>
              {busy ? t("auth.sending") : t("auth.sendCode")}
              {!busy && <Icon name="arrowRight" size={14} />}
            </Button>
          </form>
          <div className="mt-5 text-center">
            <Link href="/login" className="text-[12px] text-accent font-medium hover:underline">
              {t("auth.backToSignIn")}
            </Link>
          </div>
        </>
      )}

      {/* Step 2: OTP */}
      {step === "otp" && (
        <>
          <div className="mb-7 text-center">
            <div className="text-[22px] font-semibold tracking-tight">{t("auth.checkYourEmail")}</div>
            <div className="mt-[6px] text-[13px] text-fg-2">
              {t("auth.sentCodeTo", { email })}
            </div>
          </div>
          <form onSubmit={onVerifyOtp} className="flex flex-col gap-5">
            <OtpInput value={digits} onChange={setDigits} />
            <Button variant="primary" size="lg" type="submit" disabled={busy || digits.join("").length < 6}>
              {busy ? t("auth.verifying") : t("auth.verifyOtp")}
              {!busy && <Icon name="arrowRight" size={14} />}
            </Button>
          </form>
          <div className="mt-5 flex flex-col items-center gap-2 text-center">
            <span className="text-[12px] text-fg-3">{t("auth.didntReceiveCode")}</span>
            <button
              type="button"
              onClick={onResend}
              disabled={resendCooldown > 0 || busy}
              className="text-[12px] text-accent font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? t("auth.resendIn", { seconds: String(resendCooldown) }) : t("auth.resendCode")}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setDigits(Array(6).fill("")); }}
              className="text-[12px] text-fg-3 hover:text-fg-1 transition-colors"
            >
              {t("auth.changeEmail")}
            </button>
          </div>
        </>
      )}

      {/* Step 3: New password */}
      {step === "password" && (
        <>
          <div className="mb-7">
            <div className="text-[22px] font-semibold tracking-tight">{t("auth.setNewPassword")}</div>
            <div className="mt-[6px] text-[13px] text-fg-2">{t("auth.chooseStrongPassword")}</div>
          </div>
          <form onSubmit={onResetPassword} className="flex flex-col gap-[10px]">
            <div>
              <Label>{t("auth.newPassword")}</Label>
              <Input
                icon="lock"
                type={showPass ? "text" : "password"}
                required
                minLength={8}
                placeholder={t("auth.atLeast8Chars")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                suffix={<EyeToggle show={showPass} onToggle={() => setShowPass(v => !v)} />}
              />
            </div>
            <div>
              <Label>{t("auth.confirmPassword")}</Label>
              <Input
                icon="lock"
                type={showConf ? "text" : "password"}
                required
                minLength={8}
                placeholder={t("auth.reEnterPassword")}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                suffix={<EyeToggle show={showConf} onToggle={() => setShowConf(v => !v)} />}
              />
              {confirm && password !== confirm && (
                <p className="text-[11px] text-[var(--danger)] mt-1">{t("auth.passwordsNoMatch")}</p>
              )}
            </div>
            <Button variant="primary" size="lg" type="submit" className="mt-2"
              disabled={busy || !password || password !== confirm}>
              {busy ? t("auth.updating") : t("auth.updatePassword")}
              {!busy && <Icon name="arrowRight" size={14} />}
            </Button>
          </form>
        </>
      )}
    </>
  );
}
