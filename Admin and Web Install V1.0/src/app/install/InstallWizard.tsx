"use client";

/**
 * Web installer wizard:
 *
 *   1 Requirements → 2 Database → 3 Purchase code → 4 Admin → Done
 *
 * (Database comes before purchase — wizard state persists in the
 * installations table, so the DB must exist first.)
 *
 * Visual concept: "6AM sunrise" — a dawn atmosphere (lime accent aurora
 * meeting 6amtech-orange horizon light) behind a glass setup console with
 * a beam stepper and oversized editorial step numerals. Self-contained:
 * everything lives in this file + the Syne font loaded by page.tsx.
 */

import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/Icon";

interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

type StepId = 1 | 2 | 3 | 4 | 5;

const STEPS: { id: StepId; title: string; glyph: string }[] = [
  { id: 1, title: "Environment", glyph: "server" },
  { id: 2, title: "Database", glyph: "database" },
  { id: 3, title: "License", glyph: "shield" },
  { id: 4, title: "Admin", glyph: "user" },
  { id: 5, title: "Launch", glyph: "flag" },
];

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "6amStudio";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0";
const BRAND_ORANGE = "#FF6B00";

/** Map last COMPLETED server step → first wizard screen to show. */
function screenForServerStep(step: number): StepId {
  if (step >= 3) return 4;
  if (step >= 2) return 3;
  return 1;
}

/** Small inline glyphs the shared Icon set doesn't have — keeps the installer self-contained. */
function Glyph({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    check: <path d="M20 6L9 17l-5-5" />,
    cross: <path d="M18 6L6 18M6 6l12 12" />,
    alert: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    refresh: (
      <>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </>
    ),
    server: (
      <>
        <rect x="2" y="2" width="20" height="8" rx="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" />
        <path d="M6 6h.01M6 18h.01" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </>
    ),
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    user: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    flag: (
      <>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <path d="M4 22v-7" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Password input with show/hide eye — same pattern as the login page. */
function PasswordInput({
  className,
  value,
  onChange,
}: {
  className: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        className={`${className} pr-10`}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg-1 transition-colors"
      >
        <Icon name={show ? "eyeOff" : "eye"} size={15} />
      </button>
    </div>
  );
}

/** Oversized ghost numeral + display title + lead, shared by step screens. */
function StepHeader({ numeral, title, lead }: { numeral: string; title: string; lead: string }) {
  return (
    <div className="relative mb-8 pr-20 sm:pr-28">
      <span className="iw-numeral" aria-hidden>
        {numeral}
      </span>
      <h1 className="iw-display text-[26px] sm:text-[32px] font-bold text-fg-0 leading-[1.1] tracking-tight">
        {title}
      </h1>
      <p className="mt-2.5 text-[13.5px] text-fg-2 leading-relaxed max-w-[52ch]">{lead}</p>
    </div>
  );
}

export function InstallWizard({ initialStep }: { initialStep: number }) {
  const [screen, setScreen] = useState<StepId>(screenForServerStep(initialStep));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [checksOk, setChecksOk] = useState(false);

  // Step 2
  const [db, setDb] = useState({
    host: "127.0.0.1",
    port: "3306",
    database: "",
    username: "",
    password: "",
  });
  // Set when the server reports the target database already holds data;
  // the user must explicitly pick "erase" or "use another database".
  const [wipeWarning, setWipeWarning] = useState<{ tableCount: number } | null>(null);

  // Step 3
  const [license, setLicense] = useState({
    name: "",
    email: "",
    username: "",
    purchaseKey: "",
    domain: "",
  });

  // Step 4
  const [admin, setAdmin] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });

  const loadRequirements = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/install/requirements", { cache: "no-store" });
      const data = await res.json();
      setChecks(data.checks ?? []);
      setChecksOk(Boolean(data.ok));
    } catch {
      setError("Could not run the requirement checks. Is the server running correctly?");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (screen === 1) void loadRequirements();
  }, [screen, loadRequirements]);

  // Pre-fill the license domain from the browser host so the buyer doesn't
  // have to type it — this is the domain the activation server will register.
  useEffect(() => {
    setLicense((prev) => (prev.domain ? prev : { ...prev, domain: window.location.host }));
  }, []);

  async function post(path: string, body: unknown): Promise<Record<string, unknown> | null> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong.");
        return null;
      }
      return data;
    } catch {
      setError("Request failed. Check the server logs and try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function submitDatabase(confirmWipe = false) {
    setWipeWarning(null);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/install/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...db,
          port: parseInt(db.port, 10) || 3306,
          confirmWipe,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok) {
        setScreen(3);
      } else if (data.requiresWipeConfirmation === true) {
        setWipeWarning({ tableCount: Number(data.tableCount ?? 0) });
      } else {
        setError(typeof data.error === "string" ? data.error : "Database setup failed.");
      }
    } catch {
      setError("Request failed. Check the server logs and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPurchase() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/install/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(license),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok) {
        setScreen(4);
      } else {
        setError(typeof data.error === "string" ? data.error : "Activation failed.");
      }
    } catch {
      setError("Request failed. Check the server logs and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAdmin() {
    const data = await post("/api/install/admin", admin);
    if (data) setScreen(5);
  }

  const input =
    "iw-input w-full h-11 px-3.5 rounded-xl text-[13.5px] text-fg-0 placeholder:text-fg-3 outline-none";
  const label =
    "block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-fg-2 mb-1.5";
  const btnPrimary =
    "iw-btn-primary inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl " +
    "text-[13px] font-semibold disabled:opacity-45 disabled:cursor-not-allowed";
  const btnGhost =
    "iw-btn-ghost inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl " +
    "text-[13px] font-medium text-fg-1 disabled:opacity-45 disabled:cursor-not-allowed";

  const progress = ((screen - 1) / (STEPS.length - 1)) * 100;
  const year = new Date().getFullYear();

  return (
    <div className="iw-root relative min-h-dvh bg-bg-0 overflow-hidden flex flex-col">
      {/* dangerouslySetInnerHTML: quotes in the selectors get entity-escaped as a
          text child, which makes server and client HTML differ (hydration error) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .iw-display { font-family: var(--font-install-display, "Syne"), ui-sans-serif, sans-serif; }

        /* ── atmosphere ── */
        @keyframes iwDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(4%, -3%) scale(1.08); }
        }
        @keyframes iwDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-5%, 4%) scale(1.1); }
        }
        .iw-aurora { position: absolute; border-radius: 9999px; filter: blur(70px); pointer-events: none; }
        .iw-aurora-a {
          width: 56rem; height: 30rem; top: -16rem; left: -10rem; opacity: 0.20;
          background: radial-gradient(ellipse at center, var(--accent), transparent 62%);
          animation: iwDrift 16s ease-in-out infinite;
        }
        .iw-aurora-b {
          width: 50rem; height: 26rem; bottom: -16rem; right: -12rem; opacity: 0.16;
          background: radial-gradient(ellipse at center, ${BRAND_ORANGE}, transparent 62%);
          animation: iwDrift2 19s ease-in-out infinite;
        }
        [data-theme="light"] .iw-aurora-a { opacity: 0.16; }
        [data-theme="light"] .iw-aurora-b { opacity: 0.13; }
        .iw-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(color-mix(in srgb, var(--fg-0) 4%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--fg-0) 4%, transparent) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 90% 70% at 50% 0%, black 0%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 90% 70% at 50% 0%, black 0%, transparent 75%);
        }
        .iw-noise {
          position: absolute; inset: 0; pointer-events: none; opacity: 0.05;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* ── glass console ── */
        .iw-card {
          position: relative;
          border: 1px solid transparent;
          border-radius: 24px;
          background:
            linear-gradient(color-mix(in srgb, var(--bg-1) 72%, transparent),
                            color-mix(in srgb, var(--bg-1) 72%, transparent)) padding-box,
            linear-gradient(150deg,
              color-mix(in srgb, var(--accent) 45%, transparent),
              color-mix(in srgb, var(--fg-0) 9%, transparent) 35%,
              color-mix(in srgb, ${BRAND_ORANGE} 35%, transparent)) border-box;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow:
            0 24px 70px -28px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 color-mix(in srgb, var(--fg-0) 7%, transparent);
        }

        /* ── entrances ── */
        @keyframes iwRise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
        .iw-rise { animation: iwRise 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }

        /* ── stepper ── */
        @keyframes iwBeam {
          from { background-position: 0% 50%; }
          to { background-position: 200% 50%; }
        }
        .iw-track-fill {
          background: linear-gradient(90deg, var(--accent), ${BRAND_ORANGE}, var(--accent));
          background-size: 200% 100%;
          animation: iwBeam 3.5s linear infinite;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes iwPulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 45%, transparent); }
          50% { box-shadow: 0 0 0 7px transparent; }
        }
        .iw-node-current { animation: iwPulse 2.2s ease-out infinite; }

        /* ── controls ── */
        .iw-input {
          background: color-mix(in srgb, var(--bg-1) 80%, transparent);
          border: 1px solid var(--line-2);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .iw-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }
        .iw-btn-primary {
          position: relative; overflow: hidden;
          color: var(--accent-fg);
          background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 62%, ${BRAND_ORANGE}));
          box-shadow: 0 10px 28px -10px var(--accent-line);
          transition: transform 0.15s, box-shadow 0.2s, filter 0.2s;
        }
        .iw-btn-primary:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
        .iw-btn-primary:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        .iw-btn-primary::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.32) 50%, transparent 62%);
          transform: translateX(-120%);
        }
        .iw-btn-primary:hover:not(:disabled)::after { transition: transform 0.6s ease; transform: translateX(120%); }
        .iw-btn-ghost {
          border: 1px solid var(--line-2);
          background: color-mix(in srgb, var(--bg-1) 55%, transparent);
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .iw-btn-ghost:hover:not(:disabled) { background: var(--bg-2); color: var(--fg-0); border-color: var(--fg-3); }

        /* ── editorial numerals ── */
        .iw-numeral {
          position: absolute; top: -1.6rem; right: -0.5rem;
          font-family: var(--font-install-display, "Syne"), ui-sans-serif, sans-serif;
          font-weight: 800; font-size: clamp(72px, 12vw, 118px); line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1.5px color-mix(in srgb, var(--fg-0) 14%, transparent);
          user-select: none; pointer-events: none;
        }

        /* ── finish screen ── */
        @keyframes iwDraw { to { stroke-dashoffset: 0; } }
        .iw-draw { stroke-dasharray: 60; stroke-dashoffset: 60; animation: iwDraw 0.6s ease forwards 0.45s; }
        @keyframes iwRingDraw { to { stroke-dashoffset: 0; } }
        .iw-ring-draw { stroke-dasharray: 302; stroke-dashoffset: 302; animation: iwRingDraw 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.1s; }
        @keyframes iwRipple {
          from { transform: scale(0.7); opacity: 0.5; }
          to { transform: scale(1.9); opacity: 0; }
        }
        .iw-ripple { animation: iwRipple 1.8s ease-out infinite; }
        @keyframes iwSpark {
          0% { transform: translateY(8px) scale(0); opacity: 0; }
          25% { opacity: 1; }
          100% { transform: translateY(-46px) scale(1); opacity: 0; }
        }
        .iw-spark { position: absolute; border-radius: 9999px; animation: iwSpark 2.6s ease-out infinite; }

        /* Theme-matched 6amtech logo: white wordmark on dark, dark wordmark on light */
        .iw-logo-dark { display: none; }
        [data-theme="light"] .iw-logo-dark { display: inline-block; }
        [data-theme="light"] .iw-logo-light { display: none; }
      `,
        }}
      />

      {/* Atmosphere */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="iw-aurora iw-aurora-a" />
        <div className="iw-aurora iw-aurora-b" />
        <div className="iw-grid" />
        <div className="iw-noise" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 w-full max-w-[880px] mx-auto px-5 sm:px-8 pt-6 flex items-center justify-between iw-rise">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[color:var(--accent-fg)]"
            style={{
              background: `linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 62%, ${BRAND_ORANGE}))`,
              boxShadow: "0 0 24px -6px var(--accent)",
            }}
          >
            <Icon name="sparkles" size={17} />
          </div>
          <div>
            <span className="iw-display text-[15px] font-bold text-fg-0 leading-none">{APP_NAME}</span>
            <span className="ml-2 align-middle inline-flex px-1.5 py-0.5 rounded-md bg-accent-soft text-accent text-[10px] font-semibold">
              v{APP_VERSION}
            </span>
            <div className="text-[11px] text-fg-3 mt-0.5">Installation wizard</div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Stepper */}
      <nav
        className="relative z-10 w-full max-w-[680px] mx-auto px-8 mt-10 iw-rise"
        style={{ animationDelay: "0.08s" }}
        aria-label="Installation progress"
      >
        <div className="relative">
          {/* track */}
          <div className="absolute left-5 right-5 top-5 h-[2px] -translate-y-1/2 rounded-full bg-line-2 overflow-hidden">
            <div className="iw-track-fill h-full rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <ol className="relative flex justify-between">
            {STEPS.map((s) => {
              const done = screen > s.id;
              const current = screen === s.id;
              return (
                <li key={s.id} className="flex flex-col items-center gap-2">
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      done
                        ? "bg-accent text-[color:var(--accent-fg)]"
                        : current
                          ? "iw-node-current bg-bg-1 border-2 border-accent text-accent"
                          : "bg-bg-1 border border-line-2 text-fg-3"
                    }`}
                  >
                    {done ? <Glyph name="check" size={15} /> : <Glyph name={s.glyph} size={15} />}
                  </span>
                  <span
                    className={`hidden sm:block text-[10.5px] font-semibold uppercase tracking-[0.14em] ${
                      current ? "text-fg-0" : done ? "text-accent" : "text-fg-3"
                    }`}
                  >
                    {s.title}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      {/* Console */}
      <main className="relative z-10 flex-1 w-full max-w-[760px] mx-auto px-4 sm:px-8 mt-8 mb-10">
        <div className="iw-card iw-rise" style={{ animationDelay: "0.16s" }}>
          <div key={screen} className="iw-rise p-6 sm:p-10">
            {error && (
              <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl border border-danger/40 text-danger text-[13px] bg-bg-1/60">
                <Glyph name="alert" size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ---- Step 1: Requirements ---- */}
            {screen === 1 && (
              <div>
                <StepHeader
                  numeral="01"
                  title="Environment check"
                  lead={`Before anything is written, we make sure this server can run ${APP_NAME}.`}
                />
                <div className="rounded-2xl border border-line-2 bg-bg-1/50 divide-y divide-line mb-7 overflow-hidden">
                  {!checks &&
                    [0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
                        <span className="w-7 h-7 rounded-full bg-bg-3" />
                        <span className="h-3 w-40 rounded bg-bg-3" />
                        <span className="h-3 w-24 rounded bg-bg-3 ml-auto" />
                      </div>
                    ))}
                  {checks?.map((c, i) => (
                    <div
                      key={c.label}
                      className="iw-rise flex items-center gap-3 px-4 py-3.5"
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          c.ok ? "bg-accent-soft text-accent" : "bg-danger/10 text-danger"
                        }`}
                      >
                        <Glyph name={c.ok ? "check" : "cross"} size={13} />
                      </span>
                      <span className="text-[13px] text-fg-0 font-medium">{c.label}</span>
                      <span className="text-[12px] text-fg-3 ml-auto text-right">{c.detail}</span>
                    </div>
                  ))}
                </div>
                {checks && !checksOk && (
                  <p className="text-[13px] text-danger mb-7">
                    Some checks failed — fix them on the server, then re-check.
                  </p>
                )}
                <div className="flex justify-between">
                  <button className={btnGhost} onClick={() => void loadRequirements()} disabled={busy}>
                    {busy ? <Spinner /> : <Glyph name="refresh" size={14} />}
                    Re-check
                  </button>
                  <button className={btnPrimary} disabled={busy || !checksOk} onClick={() => setScreen(2)}>
                    Continue
                    <Icon name="arrowRight" size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ---- Step 2: Database — existing-data warning ---- */}
            {screen === 2 && wipeWarning && (
              <div>
                <div className="relative mb-7 pr-20 sm:pr-28">
                  <span className="iw-numeral" aria-hidden>
                    02
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mb-5">
                    <Glyph name="alert" size={22} />
                  </div>
                  <h1 className="iw-display text-[26px] sm:text-[32px] font-bold text-fg-0 leading-[1.1] tracking-tight">
                    This database isn&apos;t empty
                  </h1>
                  <p className="mt-2.5 text-[13.5px] text-fg-2 leading-relaxed max-w-[52ch]">
                    The database <span className="font-medium text-fg-0">{db.database}</span> on{" "}
                    <span className="font-medium text-fg-0">{db.host}</span> already holds{" "}
                    <span className="font-medium text-fg-0">{wipeWarning.tableCount} table(s)</span> of
                    existing data, and installing requires an empty database.
                  </p>
                </div>
                <div className="rounded-2xl border border-danger/40 bg-bg-1/50 px-4 py-3.5 mb-8 text-[13px] text-fg-1">
                  You can <span className="text-danger font-semibold">erase everything</span> in this
                  database and continue, or go back and connect to a different database. Erased data
                  cannot be recovered.
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 justify-end">
                  <button className={btnGhost} disabled={busy} onClick={() => setWipeWarning(null)}>
                    <Icon name="arrowLeft" size={14} />
                    Use another database
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-danger text-white text-[13px] font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed"
                    disabled={busy}
                    onClick={() => void submitDatabase(true)}
                  >
                    {busy && <Spinner />}
                    {busy ? "Erasing & installing…" : "Erase all data & continue"}
                  </button>
                </div>
              </div>
            )}

            {/* ---- Step 2: Database ---- */}
            {screen === 2 && !wipeWarning && (
              <div>
                <StepHeader
                  numeral="02"
                  title="Connect the database"
                  lead={`Enter MySQL credentials with full privileges. ${APP_NAME} creates the database if it doesn't exist and prepares every table automatically.`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={label}>Host</label>
                    <input className={input} value={db.host} onChange={(e) => setDb({ ...db, host: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Port</label>
                    <input className={input} value={db.port} onChange={(e) => setDb({ ...db, port: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Database name</label>
                    <input className={input} value={db.database} onChange={(e) => setDb({ ...db, database: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Username</label>
                    <input className={input} value={db.username} onChange={(e) => setDb({ ...db, username: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label}>Password</label>
                    <PasswordInput className={input} value={db.password} onChange={(v) => setDb({ ...db, password: v })} />
                  </div>
                </div>
                <p className="text-[12px] text-fg-3 mb-8">
                  Credentials are stored only in this server&apos;s env file — they are never sent anywhere else.
                </p>
                <div className="flex justify-between">
                  <button className={btnGhost} onClick={() => setScreen(1)} disabled={busy}>
                    <Icon name="arrowLeft" size={14} />
                    Back
                  </button>
                  <button
                    className={btnPrimary}
                    disabled={busy || !db.host || !db.database || !db.username}
                    onClick={() => void submitDatabase()}
                  >
                    {busy && <Spinner />}
                    {busy ? "Setting up — this can take a minute…" : "Set up database"}
                  </button>
                </div>
              </div>
            )}

            {/* ---- Step 3: Purchase code ---- */}
            {screen === 3 && (
              <div>
                <StepHeader
                  numeral="03"
                  title="Activate your license"
                  lead="Enter your marketplace username and the purchase code from your order to unlock this copy."
                />
                <div className="space-y-4 mb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Name</label>
                      <input
                        className={input}
                        placeholder="Your full name"
                        value={license.name}
                        onChange={(e) => setLicense({ ...license, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={label}>Email</label>
                      <input
                        className={input}
                        type="email"
                        placeholder="you@example.com"
                        value={license.email}
                        onChange={(e) => setLicense({ ...license, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={label}>Username</label>
                    <input
                      className={input}
                      placeholder="Your marketplace username"
                      value={license.username}
                      onChange={(e) => setLicense({ ...license, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={label}>Purchase code</label>
                    <input
                      className={`${input} mono`}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={license.purchaseKey}
                      onChange={(e) => setLicense({ ...license, purchaseKey: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={label}>Domain</label>
                    <input
                      className={input}
                      placeholder="your-domain.com"
                      value={license.domain}
                      onChange={(e) => setLicense({ ...license, domain: e.target.value })}
                    />
                    <p className="text-[12px] text-fg-3 mt-1.5">
                      Auto-detected from this address — edit it only if you&apos;re installing behind
                      a proxy or on a different domain.
                    </p>
                  </div>
                </div>
                <p className="text-[12px] text-fg-3 mb-8">
                  You&apos;ll find the purchase code in your order confirmation or your account&apos;s
                  downloads page.
                </p>
                <div className="flex justify-end">
                  <button
                    className={btnPrimary}
                    disabled={
                      busy ||
                      !license.name ||
                      !license.email ||
                      !license.username ||
                      !license.purchaseKey ||
                      !license.domain
                    }
                    onClick={() => void submitPurchase()}
                  >
                    {busy && <Spinner />}
                    {busy ? "Verifying…" : "Verify & continue"}
                  </button>
                </div>
              </div>
            )}

            {/* ---- Step 4: Admin ---- */}
            {screen === 4 && (
              <div>
                <StepHeader
                  numeral="04"
                  title="Create your account"
                  lead="The super admin manages settings, AI models, plans and users. You can add more admins later from the admin panel."
                />
                <div className="space-y-4 mb-8">
                  <div>
                    <label className={label}>Name</label>
                    <input className={input} value={admin.name} onChange={(e) => setAdmin({ ...admin, name: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Email</label>
                    <input className={input} type="email" value={admin.email} onChange={(e) => setAdmin({ ...admin, email: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Password (min 8 chars)</label>
                      <PasswordInput className={input} value={admin.password} onChange={(v) => setAdmin({ ...admin, password: v })} />
                    </div>
                    <div>
                      <label className={label}>Confirm password</label>
                      <PasswordInput
                        className={input}
                        value={admin.passwordConfirmation}
                        onChange={(v) => setAdmin({ ...admin, passwordConfirmation: v })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    className={btnPrimary}
                    disabled={busy || !admin.name || !admin.email || admin.password.length < 8}
                    onClick={() => void submitAdmin()}
                  >
                    {busy && <Spinner />}
                    {busy ? "Finishing…" : "Finish installation"}
                  </button>
                </div>
              </div>
            )}

            {/* ---- Step 5: Done ---- */}
            {screen === 5 && (
              <div className="relative text-center py-8">
                {/* floating sparks */}
                <div aria-hidden className="absolute inset-x-0 top-0 h-32 pointer-events-none">
                  {[
                    { left: "18%", size: 5, delay: "0s", color: "var(--accent)" },
                    { left: "30%", size: 4, delay: "0.7s", color: BRAND_ORANGE },
                    { left: "44%", size: 6, delay: "1.3s", color: "var(--accent)" },
                    { left: "58%", size: 4, delay: "0.3s", color: BRAND_ORANGE },
                    { left: "70%", size: 5, delay: "1.7s", color: "var(--accent)" },
                    { left: "84%", size: 4, delay: "1s", color: BRAND_ORANGE },
                  ].map((p, i) => (
                    <span
                      key={i}
                      className="iw-spark"
                      style={{
                        left: p.left,
                        top: "70%",
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        animationDelay: p.delay,
                      }}
                    />
                  ))}
                </div>

                <div className="relative inline-flex mb-7">
                  <span className="iw-ripple absolute inset-0 rounded-full border-2 border-accent" />
                  <svg width="96" height="96" viewBox="0 0 96 96" fill="none" className="relative">
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke="url(#iwGrad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="iw-ring-draw"
                      transform="rotate(-90 48 48)"
                    />
                    <path
                      d="M32 49l11 11 21-23"
                      stroke="var(--accent)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="iw-draw"
                    />
                    <defs>
                      <linearGradient id="iwGrad" x1="0" y1="0" x2="96" y2="96">
                        <stop stopColor="var(--accent)" />
                        <stop offset="1" stopColor={BRAND_ORANGE} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <h1 className="iw-display text-[28px] sm:text-[34px] font-bold text-fg-0 tracking-tight mb-2.5">
                  You&apos;re live.
                </h1>
                <p className="text-[13.5px] text-fg-2 leading-relaxed max-w-[46ch] mx-auto mb-7">
                  {APP_NAME} is installed and ready. Sign in to the admin panel to configure your AI
                  models and branding, or head to the user login to start editing.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-9">
                  {["Database ready", "License verified", "Admin created"].map((t, i) => (
                    <span
                      key={t}
                      className="iw-rise inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft text-accent text-[12px] font-medium"
                      style={{ animationDelay: `${0.5 + i * 0.12}s` }}
                    >
                      <Glyph name="check" size={11} />
                      {t}
                    </span>
                  ))}
                </div>
                {/* Full page loads on purpose — refreshes the middleware's install cache. */}
                <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                  <a className={btnPrimary} href="/admin/login" target="_blank" rel="noopener noreferrer">
                    Go to admin login
                    <Icon name="arrowRight" size={14} />
                  </a>
                  <a className={btnGhost} href="/login" target="_blank" rel="noopener noreferrer">
                    Go to user login
                  </a>
                </div>
                <p className="mt-8 text-[12px] text-fg-3">
                  This setup page is now locked and won&apos;t be shown again.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 w-full max-w-[880px] mx-auto px-5 sm:px-8 pb-7 flex flex-col sm:flex-row items-center justify-between gap-3 iw-rise"
        style={{ animationDelay: "0.24s" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] uppercase tracking-[0.18em] text-fg-3">Crafted by</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/6amtech-logo-light.svg" alt="6amtech" className="iw-logo-light h-6 w-auto" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/6amtech-logo.svg" alt="6amtech" className="iw-logo-dark h-6 w-auto" />
        </div>
        <p className="text-[11px] text-fg-3">© {year} 6amtech. All rights reserved.</p>
      </footer>
    </div>
  );
}
