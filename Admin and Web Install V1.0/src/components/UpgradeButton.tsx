"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";

interface Gateway {
  id: string;
  slug: string;
  title: string;
  logo: string | null;
}

interface Props {
  planId: string;
  planName: string;
  gateways: Gateway[];
  /** If true the user is downgrading; renders a different style */
  isDowngrade?: boolean;
}

export function UpgradeButton({ planId, planName, gateways, isDowngrade }: Props) {
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  async function startCheckout(gatewayId?: string) {
    setShowPicker(false);
    setLoading(true);
    const id = toast.loading(`Redirecting to ${gatewayId ? "" : "payment"}…`);
    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, gatewayId, returnMode: "panel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed.");
      toast.resolve(id, "success", "Redirecting…");
      window.location.href = data.url;
    } catch (e) {
      toast.resolve(id, "error", e instanceof Error ? e.message : "Checkout failed.");
      setLoading(false);
    }
  }

  if (gateways.length === 0) {
    return (
      <button
        disabled
        className="w-full h-9 rounded-lg border border-line-2 text-fg-3 text-[13px] flex items-center justify-center opacity-50 cursor-not-allowed"
      >
        No gateway configured
      </button>
    );
  }

  // Single gateway → go straight to checkout
  if (gateways.length === 1) {
    return (
      <button
        onClick={() => startCheckout(gateways[0].id)}
        disabled={loading}
        className={`w-full h-9 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60 ${
          isDowngrade
            ? "border border-line-2 text-fg-2 hover:bg-bg-3"
            : "bg-accent text-[var(--accent-fg)] hover:opacity-90"
        }`}
      >
        {loading ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
          </svg>
        ) : isDowngrade ? "Downgrade" : (
          <>
            Upgrade
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </>
        )}
      </button>
    );
  }

  // Multiple gateways → show picker
  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker((v) => !v)}
        disabled={loading}
        className="w-full h-9 rounded-lg bg-accent text-[var(--accent-fg)] text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
          </svg>
        ) : (
          <>
            Upgrade
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </>
        )}
      </button>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-xl border border-line bg-bg-1 shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-line text-[11px] text-fg-3 uppercase tracking-wide">
              Pay with
            </div>
            {gateways.map((gw) => (
              <button
                key={gw.id}
                onClick={() => startCheckout(gw.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-bg-2 transition-colors text-left"
              >
                {gw.logo ? (
                  <img src={gw.logo} alt={gw.title} className="w-5 h-5 object-contain rounded" />
                ) : (
                  <div className="w-5 h-5 rounded bg-bg-3 flex items-center justify-center text-[9px] font-bold text-fg-3 uppercase">
                    {gw.title.slice(0, 2)}
                  </div>
                )}
                <span className="text-[13px] text-fg-0 font-medium">{gw.title}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
