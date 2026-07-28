"use client";

import { useState, useTransition, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wand2, Save, RefreshCw, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { Icon } from "@/components/Icon";
import { translateKey, saveTranslations } from "./actions";
import { useT } from "@/lib/i18n";

type Filter = "all" | "translated" | "missing";

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-bg-2 border border-line overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="mono text-[12px] text-fg-2 shrink-0 w-[44px] text-right">{pct}%</span>
    </div>
  );
}

// ─── Single Row ────────────────────────────────────────────────────────────────

function TranslationRow({
  rowKey,
  sourceText,
  value,
  langId,
  isTranslating,
  onChange,
  onTranslated,
}: {
  rowKey: string;
  sourceText: string;
  value: string;
  langId: string;
  isTranslating: boolean;
  onChange: (key: string, val: string) => void;
  onTranslated: (key: string, val: string) => void;
}) {
  const { t } = useT();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function handleTranslate() {
    setErr(null);
    start(async () => {
      const res = await translateKey(langId, rowKey, sourceText);
      if (!res.ok) { setErr(res.error ?? "Error"); return; }
      onTranslated(rowKey, res.text!);
    });
  }

  const busy = pending || isTranslating;
  // Show as untranslated if empty OR still same as the English source
  const hasValue = value.trim().length > 0 && value.trim() !== sourceText.trim();

  return (
    <div className="grid gap-2 px-4 py-3 border-b border-line last:border-0 hover:bg-bg-2/30 transition-colors"
      style={{ gridTemplateColumns: "1fr 1fr auto" }}>
      {/* Key + source */}
      <div className="min-w-0">
        <div className="mono text-[11px] text-fg-3 mb-1 truncate">{rowKey}</div>
        <div className="text-[13px] text-fg-1 leading-snug">{sourceText}</div>
      </div>

      {/* Translation input */}
      <div className="min-w-0">
        <textarea
          value={value}
          onChange={(e) => onChange(rowKey, e.target.value)}
          placeholder={t("adminLanguages.notTranslatedPlaceholder")}
          rows={sourceText.length > 60 ? 2 : 1}
          className={`w-full resize-none rounded-[5px] border px-2.5 py-1.5 text-[13px] bg-bg-1 text-fg-0 placeholder:text-fg-4 outline-none focus:border-accent transition-colors leading-snug ${
            hasValue ? "border-line-2" : "border-dashed border-line-2"
          }`}
        />
        {err && <div className="text-[11px] text-[var(--danger)] mt-0.5">{err}</div>}
      </div>

      {/* Actions */}
      <div className="flex items-start gap-1 pt-0.5">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={busy}
          title={t("adminLanguages.autoTranslateTitle")}
          className="h-7 w-7 inline-flex items-center justify-center rounded-[5px] border border-line-2 bg-bg-2 text-fg-3 hover:text-accent hover:border-accent/40 hover:bg-accent/10 transition-colors disabled:opacity-40"
        >
          {pending ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <Wand2 size={12} />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export function TranslationEditor({
  langId,
  langName,
  langCode,
  nativeName,
  base,
  initialTranslations,
}: {
  langId: string;
  langName: string;
  langCode: string;
  nativeName: string;
  base: Record<string, string>;
  initialTranslations: Record<string, string>;
}) {
  const { t } = useT();
  const router = useRouter();
  const [translations, setTranslations] = useState<Record<string, string>>(initialTranslations);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [savePending, startSave] = useTransition();
  const [saveOk, setSaveOk] = useState(false);

  // Auto-translate state
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);
  const [autoTotal, setAutoTotal] = useState(0);
  const [autoError, setAutoError] = useState<string | null>(null);
  const stopRef = useRef(false);

  const allKeys = useMemo(() => Object.keys(base), [base]);

  const translatingKeys = useRef<Set<string>>(new Set());

  // A key needs translation if it's empty OR still has the same English text
  // (happens when a language file was seeded with English content)
  const needsTranslation = useCallback(
    (key: string) => {
      if (langCode === "en") return false;
      const val = translations[key]?.trim() ?? "";
      return !val || val === (base[key] ?? "").trim();
    },
    [langCode, translations, base],
  );

  const filteredKeys = useMemo(() => {
    let keys = allKeys;
    if (filter === "translated") keys = keys.filter((k) => !needsTranslation(k));
    if (filter === "missing")    keys = keys.filter((k) => needsTranslation(k));
    if (search.trim()) {
      const q = search.toLowerCase();
      keys = keys.filter(
        (k) =>
          k.toLowerCase().includes(q) ||
          base[k].toLowerCase().includes(q) ||
          (translations[k] ?? "").toLowerCase().includes(q),
      );
    }
    return keys;
  }, [allKeys, filter, search, translations, base, needsTranslation]);

  const missingCount   = allKeys.filter((k) => needsTranslation(k)).length;
  const translatedCount = allKeys.length - missingCount;

  function handleChange(key: string, val: string) {
    setTranslations((prev) => ({ ...prev, [key]: val }));
    setSaveOk(false);
  }

  function handleTranslated(key: string, val: string) {
    setTranslations((prev) => ({ ...prev, [key]: val }));
    setSaveOk(false);
  }

  async function startAutoTranslate() {
    const missingKeys = allKeys.filter((k) => needsTranslation(k));
    if (missingKeys.length === 0) return;

    stopRef.current = false;
    setAutoRunning(true);
    setAutoProgress(0);
    setAutoTotal(missingKeys.length);
    setAutoError(null);
    setSaveOk(false);

    for (let i = 0; i < missingKeys.length; i++) {
      if (stopRef.current) break;
      const key = missingKeys[i];
      const sourceText = base[key];
      if (!sourceText?.trim()) { setAutoProgress(i + 1); continue; }

      translatingKeys.current.add(key);
      try {
        const res = await translateKey(langId, key, sourceText);
        if (res.ok && res.text) {
          setTranslations((prev) => ({ ...prev, [key]: res.text! }));
        } else if (!res.ok) {
          // translateKey already retried internally — show the error and keep going
          setAutoError(`Key "${key}": ${res.error}`);
        }
      } catch {
        setAutoError(`Failed translating "${key}"`);
      }
      translatingKeys.current.delete(key);
      setAutoProgress(i + 1);

      // Throttle: pause between requests to stay under Google's rate limit
      if (!stopRef.current && i < missingKeys.length - 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }
    setAutoRunning(false);
  }

  function stopAutoTranslate() {
    stopRef.current = true;
  }

  function handleSave() {
    startSave(async () => {
      const res = await saveTranslations(langId, translations);
      if (res.ok) { setSaveOk(true); router.refresh(); }
    });
  }

  const progressPct = autoTotal === 0 ? 0 : Math.round((autoProgress / autoTotal) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <Link
          href="/admin/languages"
          className="inline-flex items-center gap-1 text-[12px] text-fg-2 hover:text-fg-0 mb-3"
        >
          <Icon name="arrowLeft" size={12} /> {t("adminLanguages.backToLanguages")}
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">
              {t("adminLanguages.editorBreadcrumb")}
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">
              {langName}
              <span className="ml-2 mono text-[14px] text-fg-3 font-normal">{nativeName}</span>
            </h1>
            <p className="text-[13px] text-fg-2 mt-1">
              <span className="mono bg-bg-2 border border-line-2 px-1.5 py-0.5 rounded text-[12px]">
                messages/{langCode}.json
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={savePending}
            className="h-9 px-4 inline-flex items-center gap-2 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {savePending ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : saveOk ? (
              <CheckCircle2 size={13} />
            ) : (
              <Save size={13} />
            )}
            {savePending ? t("adminLanguages.saving") : saveOk ? t("adminLanguages.saved") : t("adminLanguages.save")}
          </button>
        </div>
      </div>

      {/* Stats + Auto-translate */}
      <div className="rounded-xl border border-line bg-bg-1 p-4 sm:p-5 mb-5 sm:mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-5">
            <div>
              <div className="text-[20px] sm:text-[24px] font-semibold mono text-fg-0">{translatedCount}</div>
              <div className="text-[11px] text-fg-2">{t("adminLanguages.statTranslated")}</div>
            </div>
            <div className="w-px h-8 bg-line" />
            <div>
              <div className="text-[20px] sm:text-[24px] font-semibold mono text-fg-0">{missingCount}</div>
              <div className="text-[11px] text-fg-2">{t("adminLanguages.statMissing")}</div>
            </div>
            <div className="w-px h-8 bg-line" />
            <div>
              <div className="text-[20px] sm:text-[24px] font-semibold mono text-fg-0">{allKeys.length}</div>
              <div className="text-[11px] text-fg-2">{t("adminLanguages.statTotalKeys")}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {autoRunning ? (
              <button
                type="button"
                onClick={stopAutoTranslate}
                className="h-9 px-4 inline-flex items-center gap-2 rounded-[6px] border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)] text-[13px] font-medium hover:bg-[var(--danger)]/20 transition-colors"
              >
                {t("adminLanguages.stop")}
              </button>
            ) : (
              <button
                type="button"
                onClick={startAutoTranslate}
                disabled={missingCount === 0}
                className="h-9 px-4 inline-flex items-center gap-2 rounded-[6px] border border-line-2 bg-bg-2 text-[13px] font-medium text-fg-0 hover:bg-bg-3 transition-colors disabled:opacity-40"
              >
                <Wand2 size={14} className="text-accent" />
                <span className="hidden sm:inline">{t("adminLanguages.autoTranslateMissing")}</span>
                <span className="sm:hidden">{t("adminLanguages.autoTranslate")}</span>
                <span className="mono text-[11px] text-fg-3">({missingCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {(autoRunning || autoProgress > 0) && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px] text-fg-2">
              <span>
                {autoRunning
                  ? `${t("adminLanguages.translatingProgress")} ${autoProgress} ${t("adminLanguages.of")} ${autoTotal}`
                  : autoProgress === autoTotal
                  ? t("adminLanguages.doneKeys", { n: String(autoProgress) })
                  : t("adminLanguages.stoppedAt", { progress: String(autoProgress), total: String(autoTotal) })}
              </span>
              <span className="mono">{progressPct}%</span>
            </div>
            <ProgressBar value={autoProgress} total={autoTotal} />
            {autoError && (
              <div className="flex items-center gap-2 text-[12px] text-[var(--danger)] mt-1">
                <AlertCircle size={12} />
                {autoError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center mb-3">
        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {(["all", "missing", "translated"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`h-7 px-3 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-fg-0 text-bg-0"
                  : "bg-bg-2 border border-line-2 text-fg-1 hover:bg-bg-3"
              }`}
            >
              {f === "all" ? `${t("adminLanguages.filterAll")} (${allKeys.length})` :
               f === "missing" ? `${t("adminLanguages.filterMissing")} (${missingCount})` :
               `${t("adminLanguages.filterTranslated")} (${translatedCount})`}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 h-8 px-3 rounded-[6px] border border-line-2 bg-bg-1">
          <Search size={12} className="text-fg-3 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("adminLanguages.searchKeysPlaceholder")}
            className="flex-1 bg-transparent text-[13px] text-fg-0 placeholder:text-fg-3 outline-none"
          />
        </div>
      </div>

      {/* Keys table */}
      <div className="rounded-xl border border-line bg-bg-1 overflow-hidden">
        {/* Table head — desktop */}
        <div className="hidden sm:grid px-4 py-2.5 border-b border-line bg-bg-2 text-[11px] font-semibold text-fg-3 uppercase tracking-[0.5px]"
          style={{ gridTemplateColumns: "1fr 1fr auto" }}>
          <div>{t("adminLanguages.colSource")}</div>
          <div>{t("adminLanguages.colTranslation", { lang: langName })}</div>
          <div className="w-7" />
        </div>

        {filteredKeys.length === 0 && (
          <div className="px-4 py-12 text-center text-[13px] text-fg-3">
            {search ? t("adminLanguages.noKeysSearch") : filter === "missing" ? t("adminLanguages.allTranslated") : t("adminLanguages.noKeys")}
          </div>
        )}

        {filteredKeys.map((key) => (
          <TranslationRow
            key={key}
            rowKey={key}
            sourceText={base[key] ?? ""}
            value={translations[key] ?? ""}
            langId={langId}
            isTranslating={autoRunning}
            onChange={handleChange}
            onTranslated={handleTranslated}
          />
        ))}
      </div>

      {/* Bottom save bar */}
      {allKeys.length > 0 && (
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-10 mt-4 px-4 sm:px-6 lg:px-10 py-3 bg-bg-1/90 backdrop-blur border-t border-line flex items-center justify-between gap-4">
          <div className="text-[12px] text-fg-2">
            <span className="font-medium text-fg-0">{translatedCount}</span> {t("adminLanguages.of")}{" "}
            <span className="font-medium text-fg-0">{allKeys.length}</span> {t("adminLanguages.keysTranslated")}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={savePending}
            className="h-9 px-5 inline-flex items-center gap-2 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {savePending ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            {savePending ? t("adminLanguages.saving") : saveOk ? t("adminLanguages.saved") : t("adminLanguages.saveTranslations")}
          </button>
        </div>
      )}
    </div>
  );
}
