"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Star } from "lucide-react";
import { deleteModel, setDefaultModel } from "./actions";
import { useT } from "@/lib/i18n";

export function ModelRowActions({
  modelId,
  isDefault,
}: {
  modelId: string;
  isDefault: boolean;
}) {
  const router = useRouter();
  const { t } = useT();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function handleSetDefault() {
    start(async () => {
      await setDefaultModel(modelId);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    start(async () => {
      await deleteModel(modelId);
      router.refresh();
      setConfirm(false);
    });
  }

  return (
    <>
      {/* Set default — always rendered so column width stays fixed */}
      {isDefault ? (
        <span
          title={t("adminModels.defaultModel")}
          className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-[5px] border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b] cursor-default"
        >
          <Star size={13} fill="currentColor" />
        </span>
      ) : (
        <button
          type="button"
          onClick={handleSetDefault}
          disabled={pending}
          title={t("adminModels.setAsDefault")}
          className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-[5px] border border-line-2 bg-bg-2 text-fg-3 hover:text-[#f59e0b] hover:bg-bg-3 transition-colors disabled:opacity-50"
        >
          <Star size={13} />
        </button>
      )}

      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        title={confirm ? t("adminModels.clickToConfirm") : t("adminModels.deleteModel")}
        className={`h-7 shrink-0 inline-flex items-center justify-center gap-1 rounded-[5px] border text-[11px] font-medium transition-colors disabled:opacity-50 ${
          confirm
            ? "px-2 border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20"
            : "w-7 border-line-2 bg-bg-2 text-fg-3 hover:text-[var(--danger)] hover:border-[var(--danger)]/30 hover:bg-[var(--danger)]/10"
        }`}
      >
        <Trash2 size={12} />
        {confirm && <span>{t("adminModels.sure")}</span>}
      </button>
    </>
  );
}
