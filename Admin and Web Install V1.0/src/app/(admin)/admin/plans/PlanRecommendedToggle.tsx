"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRecommended } from "./actions";
import { toast } from "@/lib/toast";

export function PlanRecommendedToggle({
  planId,
  recommended,
}: {
  planId: string;
  recommended: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function handleToggle() {
    start(async () => {
      const res = await toggleRecommended(planId);
      if (res.ok) {
        toast.success(recommended ? "Recommendation removed." : "Plan marked as recommended.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      title={recommended ? "Remove recommendation" : "Mark as recommended"}
      dir="ltr"
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors disabled:opacity-50 focus:outline-none ${
        recommended
          ? "bg-accent border-accent"
          : "bg-bg-3 border-transparent"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          recommended ? "translate-x-3.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
