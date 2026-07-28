"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/Icon";
import { ModelForm } from "../../ModelForm";
import type { ModelResult } from "../../actions";

type InitialValues = {
  label: string;
  provider: string;
  modelId: string;
  credentials: Record<string, string>;
  notes: string;
  isActive: boolean;
  isDefault: boolean;
  creditCost: number;
};

type Props = {
  modelLabel: string;
  initial: InitialValues;
  action: (fd: FormData) => Promise<ModelResult>;
};

export function EditModelContent({ modelLabel, initial, action }: Props) {
  const { t } = useT();

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[720px] mx-auto">
      <div className="mb-5 sm:mb-6">
        <Link
          href="/admin/models"
          className="text-[12px] text-fg-2 hover:text-fg-0 inline-flex items-center gap-1"
        >
          <Icon name="arrowLeft" size={12} /> {t("adminModels.backToModels")}
        </Link>
        <h1 className="text-[20px] sm:text-[22px] font-semibold tracking-tight text-fg-0 mt-3">
          {t("adminModels.editTitle")}
        </h1>
        <p className="text-[13px] text-fg-2 mt-1 mono">{modelLabel}</p>
      </div>

      <div className="rounded-[10px] border border-line bg-bg-1 p-4 sm:p-6">
        <ModelForm
          initial={initial}
          action={action}
          submitLabel={t("adminModels.saveChanges")}
        />
      </div>
    </div>
  );
}
