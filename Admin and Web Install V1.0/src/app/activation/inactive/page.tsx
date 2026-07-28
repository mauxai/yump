import { Icon } from "@/components/Icon";

/**
 * Internal license-inactive page.
 *
 * Shown by the activation gate (src/middleware.ts → activation-gate.ts) when
 * the deployment's license is reported inactive by the activation server.
 * Replaces the old external redirect — the user stays on this domain.
 */

export const dynamic = "force-dynamic";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "6amStudio";

export default function ActivationInactivePage() {
  return (
    <div className="min-h-dvh bg-bg-0 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[480px] text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-danger/10 text-danger items-center justify-center mb-7">
          <Icon name="lock" size={28} />
        </div>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-fg-0 tracking-tight mb-3">
          License not active
        </h1>
        <p className="text-[14px] text-fg-2 leading-relaxed mb-8">
          We couldn&apos;t verify an active license for this copy of {APP_NAME} on
          this domain. Access stays locked until the license is reactivated.
          If you believe this is a mistake, please verify your purchase code or
          contact support.
        </p>
        <div className="rounded-2xl border border-line-2 bg-bg-1/60 px-5 py-4 text-left text-[13px] text-fg-2 leading-relaxed mb-8">
          Common causes: the purchase code is being used on more domains than
          your license allows, the code was refunded, or the domain changed
          without re-activation.
        </div>
        <a
          href="https://6amtech.com/contact-us"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-[13px] font-semibold text-[color:var(--accent-fg)] bg-accent hover:brightness-110 transition"
        >
          Contact support
          <Icon name="arrowRight" size={14} />
        </a>
      </div>
    </div>
  );
}
