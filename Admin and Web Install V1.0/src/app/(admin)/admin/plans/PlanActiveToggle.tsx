"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePlanActive } from "./actions";
import { toast } from "@/lib/toast";

export function PlanActiveToggle({
  planId,
  isActive,
}: {
  planId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function handleToggle() {
    start(async () => {
      const res = await togglePlanActive(planId);
      if (res.ok) {
        toast.success(isActive ? "Plan deactivated." : "Plan activated.");
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
      title={isActive ? "Deactivate plan" : "Activate plan"}
      dir="ltr"
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors disabled:opacity-50 focus:outline-none ${
        isActive ? "bg-accent border-accent" : "bg-bg-3 border-transparent"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          isActive ? "translate-x-3.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
