"use client";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Label } from "@/components/ui";
import { Combobox } from "@/components/Combobox";
import {
  countryOptions,
  timezoneOptions,
  currencyOptions,
} from "@/lib/locale-options";
import { saveSettings } from "./actions";
import { useT } from "@/lib/i18n";

type Initial = {
  country: string;
  timezone: string;
  currency: string;
};

export function GeneralForm({ initial }: { initial: Initial }) {
  const { t } = useT();
  const router = useRouter();
  const [country, setCountry] = useState(initial.country);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [currency, setCurrency] = useState(initial.currency);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty =
    country !== initial.country ||
    timezone !== initial.timezone ||
    currency !== initial.currency;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveSettings("general", [
        { key: "general.country", value: country },
        { key: "general.timezone", value: timezone },
        { key: "general.currency", value: currency },
      ]);
      if (res.ok) {
        setMsg({ tone: "ok", text: t("adminSettings.settingsSaved") });
        router.refresh();
      } else {
        setMsg({ tone: "err", text: res.error });
      }
    });
  }

  function onReset() {
    setCountry(initial.country);
    setTimezone(initial.timezone);
    setCurrency(initial.currency);
    setMsg(null);
  }

  return (
    <form onSubmit={onSubmit}>
      <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
        <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-line">
          <div className="text-[15px] font-semibold text-fg-0">{t("adminSettings.sectionLocalization")}</div>
          <div className="text-[12px] text-fg-2 mt-1">
            {t("adminSettings.localizationDesc")}
          </div>
        </div>
        <div className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <Label>{t("adminSettings.labelCountry")}</Label>
            <Combobox
              value={country}
              onChange={setCountry}
              options={countryOptions}
              placeholder={t("adminSettings.placeholderCountry")}
            />
          </div>
          <div>
            <Label>{t("adminSettings.labelTimezone")}</Label>
            <Combobox
              value={timezone}
              onChange={setTimezone}
              options={timezoneOptions}
              placeholder={t("adminSettings.placeholderTimezone")}
            />
          </div>
          <div>
            <Label>{t("adminSettings.labelCurrency")}</Label>
            <Combobox
              value={currency}
              onChange={setCurrency}
              options={currencyOptions}
              placeholder={t("adminSettings.placeholderCurrency")}
            />
          </div>
        </div>
      </section>

      <ActionBar
        msg={msg}
        dirty={dirty}
        pending={pending}
        onReset={onReset}
      />
    </form>
  );
}

function ActionBar({
  msg,
  dirty,
  pending,
  onReset,
}: {
  msg: { tone: "ok" | "err"; text: string } | null;
  dirty: boolean;
  pending: boolean;
  onReset: () => void;
}) {
  const { t } = useT();
  return (
    <div className="mt-6 sm:mt-8 flex items-center justify-between gap-4 sticky bottom-0 bg-bg-0/90 backdrop-blur-sm border-t border-line py-4 sm:py-5 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10">
      <div className="text-[12px] min-w-0 truncate">
        {msg ? (
          <span className={msg.tone === "ok" ? "text-accent" : "text-[var(--danger)]"}>
            {msg.text}
          </span>
        ) : dirty ? (
          <span className="text-fg-2">{t("adminSettings.saveToApply")}</span>
        ) : (
          <span className="text-fg-3">{t("adminSettings.allChangesSaved")}</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {dirty && (
          <button
            type="button"
            onClick={onReset}
            disabled={pending}
            className="h-9 px-3 rounded-[6px] bg-transparent border border-line-2 text-fg-1 text-[13px] font-medium hover:bg-bg-2 transition-colors"
          >
            {t("adminSettings.reset")}
          </button>
        )}
        <Button variant="primary" size="md" type="submit" disabled={pending || !dirty}>
          {pending ? t("adminSettings.saving") : t("adminSettings.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
