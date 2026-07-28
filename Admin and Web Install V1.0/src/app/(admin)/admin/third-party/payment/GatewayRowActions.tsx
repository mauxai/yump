"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteGateway, toggleGatewayActive } from "./actions";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";

export function GatewayToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const tid = toast.loading(isActive ? t("adminPayments.toastDisablingGateway") : t("adminPayments.toastEnablingGateway"));
      const res = await toggleGatewayActive(id, !isActive);
      if (res.ok) {
        toast.resolve(tid, "success", isActive ? t("adminPayments.toastGatewayDisabled") : t("adminPayments.toastGatewayEnabled"));
        router.refresh();
      } else {
        toast.resolve(tid, "error", res.error);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      dir="ltr"
      disabled={pending}
      title={isActive ? t("adminPayments.disableGateway") : t("adminPayments.enableGateway")}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        isActive ? "bg-accent" : "bg-bg-3 border border-line-2"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform ${
          isActive ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export function GatewayDeleteButton({ id, name }: { id: string; name: string }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    start(async () => {
      const tid = toast.loading(t("adminPayments.toastDeletingGateway"));
      const res = await deleteGateway(id);
      if (res.ok) {
        toast.resolve(tid, "success", `"${name}" ${t("adminPayments.toastGatewayDeleted")}`);
        router.refresh();
      } else {
        toast.resolve(tid, "error", res.error);
      }
      setConfirm(false);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      title={confirm ? t("adminPayments.clickToConfirm") : t("adminPayments.deleteGateway")}
      className={`h-7 w-7 inline-flex items-center justify-center rounded-[5px] border transition-colors disabled:opacity-50 ${
        confirm
          ? "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]"
          : "border-line-2 bg-bg-2 text-fg-3 hover:text-[var(--danger)] hover:bg-bg-3"
      }`}
    >
      <Trash2 size={13} />
    </button>
  );
}
