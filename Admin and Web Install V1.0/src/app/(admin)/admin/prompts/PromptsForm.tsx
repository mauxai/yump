"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";

export function PromptsForm({ initial }: { initial: string[] }) {
  const router = useRouter();
  const { t } = useT();
  const [prompts, setPrompts] = useState<string[]>(initial);
  const [newPrompt, setNewPrompt] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  const dirty = JSON.stringify(prompts) !== JSON.stringify(initial);

  function add() {
    const trimmed = newPrompt.trim();
    if (!trimmed || prompts.includes(trimmed) || prompts.length >= 20) return;
    setPrompts([...prompts, trimmed]);
    setNewPrompt("");
    setMsg(null);
  }

  function remove(i: number) {
    setPrompts(prompts.filter((_, idx) => idx !== i));
    setMsg(null);
  }

  function moveUp(i: number) {
    if (i === 0) return;
    const next = [...prompts];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setPrompts(next);
    setMsg(null);
  }

  function moveDown(i: number) {
    if (i === prompts.length - 1) return;
    const next = [...prompts];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setPrompts(next);
    setMsg(null);
  }

  async function onSave() {
    setPending(true);
    setMsg(null);
    const toastId = toast.loading(t("adminPrompts.toastSaving"), t("adminPrompts.toastSavingDesc"));
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.resolve(toastId, "success", t("adminPrompts.toastSaved"));
        setMsg({ tone: "ok", text: t("adminPrompts.toastSaved") });
        router.refresh();
      } else {
        const errText = data.error ?? t("adminPrompts.toastFailedDesc");
        toast.resolve(toastId, "error", t("adminPrompts.toastSaveFailed"), errText);
        setMsg({ tone: "err", text: errText });
      }
    } catch (e) {
      const errText = e instanceof Error ? e.message : t("adminPrompts.toastFailedDesc");
      toast.resolve(toastId, "error", t("adminPrompts.toastSaveFailed"), errText);
      setMsg({ tone: "err", text: errText });
    } finally {
      setPending(false);
    }
  }

  function onReset() {
    setPrompts(initial);
    setMsg(null);
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-10">

      {/* Page heading */}
      <div className="mb-5 sm:mb-8">
        <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">
          {t("adminPrompts.breadcrumb")}
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">
              {t("adminPrompts.title")}
            </h1>
            <p className="text-[13px] text-fg-2 mt-1 max-w-[560px]">
              {t("adminPrompts.subtitle")}
            </p>
          </div>
          {/* Desktop save btn in header */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {dirty && !msg && (
              <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full border border-accent/40 bg-accent/5 text-[11px] text-accent mono">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {t("adminPrompts.unsaved")}
              </span>
            )}
            {dirty && (
              <button type="button" onClick={onReset} disabled={pending}
                className="h-9 px-3 rounded-[6px] bg-transparent border border-line-2 text-fg-1 text-[13px] font-medium hover:bg-bg-2 transition-colors">
                {t("adminPrompts.reset")}
              </button>
            )}
            <Button variant="primary" size="md" onClick={onSave} disabled={pending || !dirty}>
              {pending ? t("adminPrompts.saving") : t("adminPrompts.saveChanges")}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

        {/* Left — prompt list + add */}
        <div className="space-y-4">

          {/* Prompt list card */}
          <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-line flex items-center justify-between">
              <div>
                <div className="text-[14px] font-semibold text-fg-0">{t("adminPrompts.promptList")}</div>
                <div className="text-[12px] text-fg-2 mt-0.5">{t("adminPrompts.reorderHint")}</div>
              </div>
              <span className="mono text-[12px] text-fg-3 shrink-0">{prompts.length} / 20</span>
            </div>

            <div className="divide-y divide-line">
              {prompts.map((p, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 hover:bg-bg-2 transition-colors">
                  <span className="mono text-[11px] text-fg-3 w-4 shrink-0 text-right select-none">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[13px] text-fg-0 truncate">{p}</span>
                  <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveUp(i)} disabled={i === 0} title={t("adminPrompts.moveUp")}
                      className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-md hover:bg-bg-3 text-fg-3 hover:text-fg-0 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <Icon name="arrowLeft" size={12} className="-rotate-90" />
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === prompts.length - 1} title={t("adminPrompts.moveDown")}
                      className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-md hover:bg-bg-3 text-fg-3 hover:text-fg-0 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <Icon name="arrowRight" size={12} className="-rotate-90" />
                    </button>
                    <div className="w-px h-4 bg-line mx-0.5" />
                    <button onClick={() => remove(i)} title={t("adminPrompts.remove")}
                      className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-md hover:bg-[var(--danger)]/10 text-fg-3 hover:text-[var(--danger)] transition-colors">
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {prompts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Icon name="wand" size={24} className="text-fg-3 mb-2" />
                  <p className="text-[13px] text-fg-2">{t("adminPrompts.emptyTitle")}</p>
                  <p className="text-[12px] text-fg-3 mt-0.5">{t("adminPrompts.emptySubtitle")}</p>
                </div>
              )}
            </div>
          </section>

          {/* Add prompt card */}
          {prompts.length < 20 && (
            <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-line">
                <div className="text-[14px] font-semibold text-fg-0">{t("adminPrompts.addPrompt")}</div>
              </div>
              <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Input
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
                    placeholder={t("adminPrompts.addPlaceholder")}
                    className="w-full"
                  />
                </div>
                <Button variant="primary" onClick={add} disabled={!newPrompt.trim()} className="shrink-0 w-full sm:w-auto">
                  <Icon name="plus" size={14} />
                  {t("adminPrompts.add")}
                </Button>
              </div>
            </section>
          )}

          {/* Stats — visible on mobile below the list */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <div className="rounded-[10px] border border-line bg-bg-1 px-4 py-3">
              <div className="text-[22px] font-semibold mono text-fg-0">{prompts.length}</div>
              <div className="text-[11px] text-fg-2 mt-0.5">{t("adminPrompts.activePrompts")}</div>
            </div>
            <div className="rounded-[10px] border border-line bg-bg-1 px-4 py-3">
              <div className="text-[22px] font-semibold mono text-fg-0">{20 - prompts.length}</div>
              <div className="text-[11px] text-fg-2 mt-0.5">{t("adminPrompts.slotsRemaining")}</div>
            </div>
          </div>
        </div>

        {/* Right — live preview (desktop only) */}
        <div className="hidden lg:block">
          <section className="rounded-xl border border-line bg-bg-1 overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b border-line">
              <div className="text-[14px] font-semibold text-fg-0">{t("adminPrompts.preview")}</div>
              <div className="text-[12px] text-fg-2 mt-0.5">{t("adminPrompts.previewSubtitle")}</div>
            </div>
            <div className="p-6">
              <div className="rounded-lg border border-line bg-bg-0 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-9 rounded-lg border border-line bg-bg-2 px-3 flex items-center">
                    <span className="text-[12px] text-fg-3">{t("adminPrompts.previewPlaceholder")}</span>
                  </div>
                  <div className="h-9 px-4 rounded-lg bg-accent flex items-center">
                    <span className="text-[12px] text-[var(--accent-fg)] font-medium">{t("adminPrompts.previewGenerate")}</span>
                  </div>
                </div>
                <div className="flex gap-[6px] flex-wrap items-center">
                  <span className="mono text-[10px] text-fg-3 mr-1">{t("adminPrompts.tryLabel")}</span>
                  {prompts.length > 0 ? prompts.map((p) => (
                    <span key={p} className="text-[10px] px-[8px] h-[20px] inline-flex items-center rounded-full border border-line-2 text-fg-2">
                      {p}
                    </span>
                  )) : (
                    <span className="text-[11px] text-fg-3 italic">{t("adminPrompts.noPromptsConfigured")}</span>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-line bg-bg-2 px-4 py-3">
                  <div className="text-[22px] font-semibold mono text-fg-0">{prompts.length}</div>
                  <div className="text-[11px] text-fg-2 mt-0.5">{t("adminPrompts.activePrompts")}</div>
                </div>
                <div className="rounded-lg border border-line bg-bg-2 px-4 py-3">
                  <div className="text-[22px] font-semibold mono text-fg-0">{20 - prompts.length}</div>
                  <div className="text-[11px] text-fg-2 mt-0.5">{t("adminPrompts.slotsRemaining")}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>

      {/* Sticky action bar */}
      <div className="mt-6 sm:mt-8 flex items-center justify-between gap-4 sticky bottom-0 bg-bg-0/90 backdrop-blur-sm border-t border-line py-4 sm:py-5 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10">
        <div className="text-[12px] min-w-0 truncate">
          {msg ? (
            <span className={msg.tone === "ok" ? "text-accent" : "text-[var(--danger)]"}>{msg.text}</span>
          ) : dirty ? (
            <span className="text-fg-2">{t("adminPrompts.unsavedChanges")}</span>
          ) : (
            <span className="text-fg-3">{t("adminPrompts.allSaved")}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dirty && (
            <button type="button" onClick={onReset} disabled={pending}
              className="h-9 px-3 rounded-[6px] bg-transparent border border-line-2 text-fg-1 text-[13px] font-medium hover:bg-bg-2 transition-colors">
              {t("adminPrompts.reset")}
            </button>
          )}
          <Button variant="primary" size="md" onClick={onSave} disabled={pending || !dirty}>
            {pending ? t("adminPrompts.saving") : t("adminPrompts.saveChanges")}
          </Button>
        </div>
      </div>
    </div>
  );
}
