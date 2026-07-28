"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Trash2, Globe, Languages } from "lucide-react";
import { LANGUAGES, type LanguageOption } from "@/lib/language-options";
import { useT } from "@/lib/i18n";
import {
  addLanguage,
  removeLanguage,
  setDefaultLanguage,
  toggleLanguage,
} from "./actions";

type Language = {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  direction: string;
  isDefault: boolean;
  isActive: boolean;
};

// ─── Add Language Modal ────────────────────────────────────────────────────────

function AddLanguageModal({
  addedCodes,
  onClose,
}: {
  addedCodes: string[];
  onClose: () => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const available = useMemo(
    () =>
      LANGUAGES.filter(
        (l) =>
          !addedCodes.includes(l.code) &&
          (search === "" ||
            l.name.toLowerCase().includes(search.toLowerCase()) ||
            l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
            l.code.toLowerCase().includes(search.toLowerCase())),
      ),
    [addedCodes, search],
  );

  function selectLang(lang: LanguageOption) {
    if (selected === lang.code) {
      setSelected(null);
    } else {
      setSelected(lang.code);
      // Pre-fill direction from constants, admin can override
      setDirection(lang.direction);
    }
  }

  function submit() {
    if (!selected) return;
    start(async () => {
      const res = await addLanguage(selected, direction);
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
      onClose();
    });
  }

  const selectedLang = selected ? LANGUAGES.find((l) => l.code === selected) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
      style={{ background: "color-mix(in srgb, var(--bg-0) 70%, transparent)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-[14px] border border-line-2 bg-bg-1 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-fg-3/30" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 sm:pt-5 pb-3 border-b border-line shrink-0">
          <h2 className="text-[15px] font-semibold text-fg-0">{t("adminLanguages.modalAddTitle")}</h2>
          <p className="text-[12px] text-fg-2 mt-0.5">
            {t("adminLanguages.modalAddDesc")}
          </p>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-line shrink-0">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("adminLanguages.searchPlaceholder")}
            className="w-full h-9 px-3 rounded-[6px] bg-bg-2 border border-line-2 text-[13px] text-fg-0 placeholder:text-fg-3 outline-none focus:border-accent"
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 py-1">
          {available.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px] text-fg-3">
              {search ? t("adminLanguages.noMatch") : t("adminLanguages.allAdded")}
            </div>
          )}
          {available.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => selectLang(lang)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                selected === lang.code ? "bg-accent/10" : "hover:bg-bg-2"
              }`}
            >
              <div className={`w-2 h-2 rounded-full border-2 shrink-0 ${
                selected === lang.code ? "border-accent bg-accent" : "border-line-2"
              }`} />
              <div className="flex-1 min-w-0">
                <span className="text-[13px] text-fg-0 font-medium">{lang.name}</span>
                <span className="text-[12px] text-fg-2 ml-2">{lang.nativeName}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="mono text-[10px] text-fg-3 px-1.5 py-0.5 rounded bg-bg-2 border border-line-2">
                  {lang.code}
                </span>
                <span className={`mono text-[10px] px-1.5 py-0.5 rounded border ${
                  lang.direction === "rtl"
                    ? "bg-[var(--accent)]/10 text-accent border-accent/30"
                    : "bg-bg-2 text-fg-3 border-line-2"
                }`}>
                  {lang.direction.toUpperCase()}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Direction selector — shown only when a language is selected */}
        {selectedLang && (
          <div className="px-4 py-3 border-t border-line shrink-0 bg-bg-2/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[12px] font-medium text-fg-0">
                  {t("adminLanguages.dirLabel")} <span className="text-accent">{selectedLang.name}</span>
                </div>
                <div className="text-[11px] text-fg-3 mt-0.5">
                  {t("adminLanguages.dirDesc")}
                </div>
              </div>
              <div className="flex rounded-[6px] border border-line-2 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setDirection("ltr")}
                  className={`h-8 px-3 text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
                    direction === "ltr"
                      ? "bg-fg-0 text-bg-0"
                      : "bg-bg-1 text-fg-2 hover:bg-bg-3"
                  }`}
                >
                  <span>←→</span>
                  <span>LTR</span>
                </button>
                <div className="w-px bg-line-2" />
                <button
                  type="button"
                  onClick={() => setDirection("rtl")}
                  className={`h-8 px-3 text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
                    direction === "rtl"
                      ? "bg-fg-0 text-bg-0"
                      : "bg-bg-1 text-fg-2 hover:bg-bg-3"
                  }`}
                >
                  <span>→←</span>
                  <span>RTL</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {error && (
          <div className="px-5 py-2 text-[12px] text-[var(--danger)] border-t border-line shrink-0">
            {error}
          </div>
        )}
        <div className="flex gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-line shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none h-9 px-4 rounded-[6px] border border-line-2 bg-bg-2 text-[13px] text-fg-1 hover:bg-bg-3 transition-colors"
          >
            {t("adminLanguages.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!selected || pending}
            className="flex-1 sm:flex-none h-9 px-5 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {pending ? t("adminLanguages.adding") : t("adminLanguages.addLanguage")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  lang,
  onClose,
  onConfirm,
  pending,
  error,
}: {
  lang: Language;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
  error: string | null;
}) {
  const { t } = useT();
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
      style={{ background: "color-mix(in srgb, var(--bg-0) 70%, transparent)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-[420px] rounded-t-2xl sm:rounded-[14px] border border-line-2 bg-bg-1 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-fg-3/30" />
        </div>

        <div className="px-5 pt-4 sm:pt-5 pb-5">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
            style={{ background: "oklch(0.68 0.18 25 / 0.12)", border: "1px solid oklch(0.68 0.18 25 / 0.3)" }}>
            <Trash2 size={18} style={{ color: "var(--danger)" }} />
          </div>

          <h2 className="text-[15px] font-semibold text-fg-0 mb-1">{t("adminLanguages.deleteTitle")}</h2>
          <p className="text-[13px] text-fg-2 mb-1">
            {t("adminLanguages.deleteConfirmPrefix")}{" "}
            <span className="font-medium text-fg-0">{lang.name}</span>{" "}
            <span className="mono text-[12px] text-fg-3">({lang.code})</span>?
          </p>
          <p className="text-[12px] text-fg-3">
            The translation file{" "}
            <code className="mono text-[11px] bg-bg-2 px-1 py-0.5 rounded border border-line-2">
              messages/{lang.code}.json
            </code>{" "}
            {t("adminLanguages.deleteKeptOnDisk")}
          </p>

          {error && (
            <div className="mt-3 text-[12px] text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-[6px] px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 h-9 rounded-[6px] border border-line-2 bg-bg-2 text-[13px] text-fg-1 hover:bg-bg-3 transition-colors disabled:opacity-40"
            >
              {t("adminLanguages.cancel")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="flex-1 h-9 rounded-[6px] text-[13px] font-medium text-white transition-colors disabled:opacity-40"
              style={{ background: "var(--danger)" }}
            >
              {pending ? t("adminLanguages.deleting") : t("adminLanguages.deleteTitle")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Row Actions ───────────────────────────────────────────────────────────────

function LanguageRowActions({ lang }: { lang: Language }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function act(fn: () => Promise<{ ok: boolean; error?: string }>) {
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) { setError(res.error ?? "Error"); return; }
      router.refresh();
    });
  }

  function handleDelete() {
    setError(null);
    start(async () => {
      const res = await removeLanguage(lang.id);
      if (!res.ok) { setError(res.error ?? "Error"); return; }
      setShowDelete(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {error && (
          <span className="text-[11px] text-[var(--danger)] mr-1">{error}</span>
        )}

        {/* Translations link */}
        <Link
          href={`/admin/languages/${lang.id}`}
          title={t("adminLanguages.translate")}
          className="h-7 px-2 inline-flex items-center gap-1.5 rounded-[5px] border border-line-2 bg-bg-2 text-[11px] font-medium text-fg-1 hover:bg-bg-3 transition-colors"
        >
          <Languages size={12} />
          <span>{t("adminLanguages.translate")}</span>
        </Link>

        {/* Toggle active */}
        <button
          type="button"
          disabled={pending || (lang.isDefault && lang.isActive) || lang.code === "en"}
          onClick={() => act(() => toggleLanguage(lang.id))}
          title={lang.code === "en" ? t("adminLanguages.disableEnglishTitle") : lang.isActive ? t("adminLanguages.disable") : t("adminLanguages.enable")}
          className={`h-7 px-2 rounded-[5px] border text-[11px] font-medium transition-colors disabled:opacity-40 ${
            lang.isActive
              ? "border-line-2 bg-bg-2 text-fg-1 hover:bg-bg-3"
              : "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20"
          }`}
        >
          {lang.isActive ? t("adminLanguages.disable") : t("adminLanguages.enable")}
        </button>

        {/* Set default */}
        {!lang.isDefault && (
          <button
            type="button"
            disabled={pending || !lang.isActive}
            onClick={() => act(() => setDefaultLanguage(lang.id))}
            title={t("adminLanguages.setDefault")}
            className="h-7 w-7 inline-flex items-center justify-center rounded-[5px] border border-line-2 bg-bg-2 text-fg-3 hover:text-[#f59e0b] hover:bg-bg-3 transition-colors disabled:opacity-40"
          >
            <Star size={13} />
          </button>
        )}

        {/* Delete */}
        <button
          type="button"
          disabled={pending || lang.isDefault || lang.code === "en"}
          onClick={() => setShowDelete(true)}
          title={lang.code === "en" ? t("adminLanguages.deleteEnglishTitle") : lang.isDefault ? t("adminLanguages.deleteDefaultTitle") : t("adminLanguages.deleteIconTitle")}
          className="h-7 w-7 inline-flex items-center justify-center rounded-[5px] border border-line-2 bg-bg-2 text-fg-3 hover:text-[var(--danger)] hover:border-[var(--danger)]/30 hover:bg-[var(--danger)]/10 transition-colors disabled:opacity-40"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {showDelete && (
        <DeleteConfirmModal
          lang={lang}
          onClose={() => { setShowDelete(false); setError(null); }}
          onConfirm={handleDelete}
          pending={pending}
          error={error}
        />
      )}
    </>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export function LanguageManager({
  languages,
}: {
  languages: Language[];
}) {
  const { t } = useT();
  const [showAdd, setShowAdd] = useState(false);
  const addedCodes = languages.map((l) => l.code);
  const activeCount = languages.filter((l) => l.isActive).length;
  const defaultLang = languages.find((l) => l.isDefault);

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-10 max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-8">
          <div>
            <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">
              {t("adminLanguages.breadcrumb")}
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">
              {t("adminLanguages.title")}
            </h1>
            <p className="hidden sm:block text-[13px] text-fg-2 mt-1 max-w-[540px]">
              {t("adminLanguages.subtitle")} <code className="mono text-[12px]">messages/</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="shrink-0 h-9 px-4 inline-flex items-center gap-2 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <span className="text-[18px] leading-none">+</span>
            <span className="hidden sm:inline">{t("adminLanguages.addLanguage")}</span>
            <span className="sm:hidden">{t("adminLanguages.addShort")}</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5 sm:mb-6">
          <div className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4">
            <div className="text-[20px] sm:text-[28px] font-semibold mono tracking-tight text-fg-0">
              {languages.length}
            </div>
            <div className="text-[10px] sm:text-[12px] text-fg-2 mt-0.5 leading-tight">{t("adminLanguages.statTotal")}</div>
          </div>
          <div className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4">
            <div className="text-[20px] sm:text-[28px] font-semibold mono tracking-tight text-fg-0">
              {activeCount}
            </div>
            <div className="text-[10px] sm:text-[12px] text-fg-2 mt-0.5 leading-tight">{t("adminLanguages.statActive")}</div>
          </div>
          <div className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4">
            <div className="text-[13px] sm:text-[15px] font-semibold mono tracking-tight text-fg-0 truncate">
              {defaultLang ? defaultLang.code.toUpperCase() : "—"}
            </div>
            <div className="text-[10px] sm:text-[12px] text-fg-2 mt-0.5 leading-tight">{t("adminLanguages.statDefault")}</div>
          </div>
        </div>

        {/* Empty state */}
        {languages.length === 0 && (
          <div className="rounded-xl border border-line border-dashed bg-bg-1 px-6 py-14 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-bg-2 border border-line flex items-center justify-center mb-4">
              <Globe size={20} className="text-fg-3" />
            </div>
            <div className="text-[14px] font-medium text-fg-0 mb-1">{t("adminLanguages.emptyTitle")}</div>
            <div className="text-[13px] text-fg-2 mb-5">
              {t("adminLanguages.emptyDesc")}
            </div>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="h-9 px-5 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity"
            >
              {t("adminLanguages.addLanguage")}
            </button>
          </div>
        )}

        {/* Desktop table */}
        {languages.length > 0 && (
          <>
            <div className="hidden sm:block rounded-xl border border-line bg-bg-1 overflow-hidden">
              {/* Table head */}
              <div className="grid text-[11px] font-semibold text-fg-3 uppercase tracking-[0.5px] px-4 py-2.5 border-b border-line bg-bg-2"
                style={{ gridTemplateColumns: "1fr 80px 60px 80px 1fr" }}>
                <div>{t("adminLanguages.colLanguage")}</div>
                <div>{t("adminLanguages.colCode")}</div>
                <div>{t("adminLanguages.colDir")}</div>
                <div>{t("adminLanguages.colStatus")}</div>
                <div className="text-right">{t("adminLanguages.colActions")}</div>
              </div>
              {languages.map((lang) => (
                <div
                  key={lang.id}
                  className="grid items-center px-4 py-3 border-b border-line last:border-0"
                  style={{ gridTemplateColumns: "1fr 80px 60px 80px 1fr" }}
                >
                  <div>
                    <div className="text-[13px] font-medium text-fg-0">{lang.name}</div>
                    <div className="text-[11px] text-fg-2 mono">{lang.nativeName}</div>
                  </div>
                  <div>
                    <span className="mono text-[11px] px-1.5 py-0.5 rounded bg-bg-2 border border-line-2 text-fg-1">
                      {lang.code}
                    </span>
                  </div>
                  <div className="text-[12px] text-fg-2 mono uppercase">{lang.direction}</div>
                  <div>
                    {lang.isDefault ? (
                      <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
                        <Star size={9} className="shrink-0" />{t("adminLanguages.badgeDefault")}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center h-6 px-2 rounded-full text-[11px] font-medium border ${
                        lang.isActive
                          ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30"
                          : "bg-bg-2 text-fg-3 border-line-2"
                      }`}>
                        {lang.isActive ? t("adminLanguages.badgeActive") : t("adminLanguages.badgeInactive")}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <LanguageRowActions lang={lang} />
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden flex flex-col gap-2">
              {languages.map((lang) => (
                <div key={lang.id} className="rounded-xl border border-line bg-bg-1 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-medium text-fg-0">{lang.name}</span>
                        <span className="mono text-[10px] px-1.5 py-0.5 rounded bg-bg-2 border border-line-2 text-fg-1">
                          {lang.code}
                        </span>
                        <span className="mono text-[10px] px-1.5 py-0.5 rounded bg-bg-2 border border-line-2 text-fg-2 uppercase">
                          {lang.direction}
                        </span>
                      </div>
                      <div className="text-[12px] text-fg-2 mono mt-0.5">{lang.nativeName}</div>
                    </div>
                    <div className="shrink-0">
                      {lang.isDefault ? (
                        <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] font-medium bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
                          <Star size={9} className="shrink-0" />{t("adminLanguages.badgeDefault")}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center h-6 px-2 rounded-full text-[11px] font-medium border ${
                          lang.isActive
                            ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30"
                            : "bg-bg-2 text-fg-3 border-line-2"
                        }`}>
                          {lang.isActive ? t("adminLanguages.badgeActive") : t("adminLanguages.badgeInactive")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-line pt-3">
                    <LanguageRowActions lang={lang} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Info box */}
        {languages.length > 0 && (
          <div className="mt-6 rounded-lg border border-line bg-bg-1 p-4 flex gap-3">
            <Globe size={16} className="text-fg-3 shrink-0 mt-0.5" />
            <div>
              <div className="text-[12px] font-medium text-fg-0 mb-0.5">{t("adminLanguages.infoTitle")}</div>
              <div className="text-[12px] text-fg-2">
                {t("adminLanguages.infoDesc1")}{" "}
                <code className="mono text-[11px] bg-bg-2 px-1 py-0.5 rounded border border-line-2">
                  messages/[code].json
                </code>
                . {t("adminLanguages.infoDesc2")}{" "}
                <code className="mono text-[11px] bg-bg-2 px-1 py-0.5 rounded border border-line-2">
                  messages/en.json
                </code>{" "}
                {t("adminLanguages.infoDesc3")}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddLanguageModal addedCodes={addedCodes} onClose={() => setShowAdd(false)} />
      )}
    </>
  );
}
