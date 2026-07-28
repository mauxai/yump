"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { toast } from "@/lib/toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { MailTemplate } from "@prisma/client";
import { useT } from "@/lib/i18n";

// ── Variable chips ────────────────────────────────────────────────────────────
const MAIL_VARS = [
  "brand_name", "user_name", "user_email", "otp", "reset_url",
  "amount", "currency", "plan_name", "credits", "date", "app_url",
] as const;

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name:     "",
  key:      "",
  subject:  "",
  body:     "",
  isActive: true,
};

type FormState = typeof EMPTY_FORM;

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 100);
}

// ── Variable chip that inserts into textarea ──────────────────────────────────
function VarChip({
  variable,
  onClick,
}: {
  variable: string;
  onClick: (v: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(variable)}
      className="inline-flex items-center h-6 px-2 rounded-md bg-bg-2 border border-line-2 text-[11px] font-mono text-accent hover:bg-accent-soft hover:border-accent-line transition-colors"
    >
      {`{{${variable}}}`}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function MailTemplatesManager({ initial }: { initial: MailTemplate[] }) {
  const { t } = useT();
  const router = useRouter();
  const [templates, setTemplates] = useState<MailTemplate[]>(initial);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewEmail, setPreviewEmail] = useState("");
  const [previewSending, setPreviewSending] = useState(false);
  const [htmlPreviewTemplate, setHtmlPreviewTemplate] = useState<MailTemplate | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setKeyManuallyEdited(false);
    setShowForm(true);
  }

  function openEdit(tmpl: MailTemplate) {
    setForm({ name: tmpl.name, key: tmpl.key, subject: tmpl.subject, body: tmpl.body, isActive: tmpl.isActive });
    setEditing(tmpl.id);
    setKeyManuallyEdited(true); // don't auto-rewrite key when editing
    setShowForm(true);
    toast.info(`Editing "${tmpl.name}"`, t("adminMailTemplates.toastEditingDesc"));
  }

  function closeForm() { setShowForm(false); setEditing(null); }

  function handleNameChange(name: string) {
    const update: Partial<FormState> = { name };
    if (!keyManuallyEdited) {
      update.key = slugify(name);
    }
    setForm((f) => ({ ...f, ...update }));
  }

  function handleKeyChange(key: string) {
    setKeyManuallyEdited(true);
    setForm((f) => ({ ...f, key: slugify(key) }));
  }

  // Insert variable at cursor position in the body textarea
  const insertVar = useCallback((variable: string) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? ta.value.length;
    const end   = ta.selectionEnd   ?? ta.value.length;
    const insert = `{{${variable}}}`;
    const next = ta.value.slice(0, start) + insert + ta.value.slice(end);
    setForm((f) => ({ ...f, body: next }));
    // Restore cursor after insertion (async so state has updated)
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + insert.length, start + insert.length);
    }, 0);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading(editing ? t("adminMailTemplates.toastSaving") : t("adminMailTemplates.toastCreating"), "");
    try {
      const res = await fetch(
        editing ? `/api/admin/mail-templates/${editing}` : "/api/admin/mail-templates",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (!res.ok) { toast.resolve(toastId, "error", data.error ?? t("adminMailTemplates.toastFailed")); return; }
      toast.resolve(toastId, "success", editing ? t("adminMailTemplates.toastUpdated") : t("adminMailTemplates.toastCreated"));
      closeForm();
      router.refresh();
      if (editing) {
        setTemplates((prev) => prev.map((tmpl) => tmpl.id === editing ? { ...tmpl, ...data.template } : tmpl));
      } else {
        setTemplates((prev) => [...prev, data.template].sort((a, b) => a.key.localeCompare(b.key)));
      }
    } catch (err) {
      toast.resolve(toastId, "error", t("adminMailTemplates.toastRequestFailed"), err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(tmpl: MailTemplate) {
    const toastId = toast.loading(t("adminMailTemplates.toastUpdating"), "");
    try {
      const res = await fetch(`/api/admin/mail-templates/${tmpl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tmpl.isActive }),
      });
      const data = await res.json();
      if (!res.ok) { toast.resolve(toastId, "error", data.error ?? t("adminMailTemplates.toastFailed")); return; }
      toast.resolve(toastId, "success", tmpl.isActive ? t("adminMailTemplates.toastDisabled") : t("adminMailTemplates.toastEnabled"));
      setTemplates((prev) => prev.map((x) => x.id === tmpl.id ? { ...x, isActive: !tmpl.isActive } : x));
    } catch {
      toast.resolve(toastId, "error", t("adminMailTemplates.toastRequestFailed"));
    }
  }

  async function onDelete(id: string) {
    setDeleting(id);
    const toastId = toast.loading(t("adminMailTemplates.toastDeleting"), "");
    try {
      const res = await fetch(`/api/admin/mail-templates/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.resolve(toastId, "error", t("adminMailTemplates.toastFailedDelete")); return; }
      toast.resolve(toastId, "success", t("adminMailTemplates.toastDeleted"));
      setTemplates((prev) => prev.filter((tmpl) => tmpl.id !== id));
    } catch {
      toast.resolve(toastId, "error", t("adminMailTemplates.toastRequestFailed"));
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  }

  async function sendPreview() {
    if (!previewId || !previewEmail) return;
    setPreviewSending(true);
    const toastId = toast.loading(t("adminMailTemplates.toastSendingPreview"), "");
    try {
      const res = await fetch(`/api/admin/mail-templates/${previewId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: previewEmail }),
      });
      const data = await res.json();
      if (!res.ok) { toast.resolve(toastId, "error", data.error ?? t("adminMailTemplates.toastFailed")); return; }
      toast.resolve(toastId, "success", t("adminMailTemplates.toastPreviewSent"), `Check ${previewEmail}`);
      setPreviewId(null);
      setPreviewEmail("");
    } catch (err) {
      toast.resolve(toastId, "error", t("adminMailTemplates.toastRequestFailed"), err instanceof Error ? err.message : undefined);
    } finally {
      setPreviewSending(false);
    }
  }

  const activeCount = templates.filter((tmpl) => tmpl.isActive).length;

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-10">

      {/* Header */}
      <div className="mb-5 sm:mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">{t("adminMailTemplates.breadcrumb")}</div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">{t("adminMailTemplates.title")}</h1>
          <p className="text-[13px] text-fg-2 mt-1 max-w-[560px] hidden sm:block">
            {t("adminMailTemplates.subtitle")}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t("adminMailTemplates.statTotal"),    value: templates.length, icon: "mail" },
          { label: t("adminMailTemplates.statActive"),   value: activeCount, icon: "eye" },
          { label: t("adminMailTemplates.statInactive"), value: templates.length - activeCount, icon: "close" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex w-9 h-9 rounded-lg bg-accent-soft border border-accent-line items-center justify-center shrink-0">
              <Icon name={s.icon as "mail" | "eye" | "close"} size={15} className="text-accent" />
            </div>
            <div>
              <div className="text-[20px] sm:text-[22px] font-semibold mono text-fg-0 leading-none">{s.value}</div>
              <div className="text-[10px] sm:text-[11px] text-fg-3 mt-0.5 leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Templates list */}
      <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
        <div className="divide-y divide-line">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className={`transition-colors ${!tmpl.isActive ? "opacity-60" : ""}`}>

              {/* ── Desktop row ── */}
              <div className="hidden sm:flex items-center gap-4 px-5 py-4 hover:bg-bg-2 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-bg-2 border border-line flex items-center justify-center shrink-0">
                  <Icon name="mail" size={16} className={tmpl.isActive ? "text-accent" : "text-fg-3"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium text-fg-0">{tmpl.name}</span>
                    <span className="inline-flex items-center h-5 px-2 rounded-md bg-bg-3 border border-line-2 text-[10px] font-mono text-fg-2">{tmpl.key}</span>
                  </div>
                  <p className="text-[12px] text-fg-3 mt-0.5 truncate max-w-[500px]">{tmpl.subject}</p>
                </div>
                <button onClick={() => toggleActive(tmpl)} title={tmpl.isActive ? t("adminMailTemplates.disableTemplate") : t("adminMailTemplates.enableTemplate")} className="shrink-0 flex items-center gap-2">
                  <span dir="ltr" className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors duration-200 ${tmpl.isActive ? "bg-accent" : "bg-bg-3 border border-line-2"}`}>
                    <span className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${tmpl.isActive ? "translate-x-[16px]" : "translate-x-[3px]"}`} />
                  </span>
                  <span className={`text-[11px] font-medium w-12 ${tmpl.isActive ? "text-accent" : "text-fg-3"}`}>{tmpl.isActive ? t("adminMailTemplates.statusActive") : t("adminMailTemplates.statusInactive")}</span>
                </button>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => setHtmlPreviewTemplate(tmpl)} title="Preview" className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-bg-3 text-fg-3 hover:text-fg-0 transition-colors"><Icon name="eye" size={13} /></button>
                  <button onClick={() => { setPreviewId(tmpl.id); setPreviewEmail(""); }} title="Send test email" className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-bg-3 text-fg-3 hover:text-fg-0 transition-colors"><Icon name="mail" size={13} /></button>
                  <button onClick={() => openEdit(tmpl)} title="Edit" className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-bg-3 text-fg-3 hover:text-fg-0 transition-colors"><Icon name="pencil" size={13} /></button>
                </div>
              </div>

              {/* ── Mobile card ── */}
              <div className="sm:hidden px-4 py-3 hover:bg-bg-2 transition-colors active:bg-bg-2">
                {/* Top: name + status badge */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-fg-0 leading-tight">{tmpl.name}</div>
                    <span className="inline-flex items-center h-5 px-2 rounded-md bg-bg-3 border border-line-2 text-[10px] font-mono text-fg-2 mt-1">{tmpl.key}</span>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 h-5 px-2 rounded-full border text-[10px] font-semibold mt-0.5 ${tmpl.isActive ? "bg-accent/10 text-accent border-accent/20" : "bg-bg-3 text-fg-3 border-line-2"}`}>
                    <span className={`w-1 h-1 rounded-full ${tmpl.isActive ? "bg-accent" : "bg-fg-3"}`} />
                    {tmpl.isActive ? t("adminMailTemplates.statusActive") : t("adminMailTemplates.statusInactive")}
                  </span>
                </div>
                {/* Subject */}
                <p className="text-[12px] text-fg-3 truncate mt-1.5 mb-2">{tmpl.subject}</p>
                {/* Action strip */}
                <div className="flex items-center justify-between pt-2 border-t border-line">
                  <button
                    onClick={() => toggleActive(tmpl)}
                    title={tmpl.isActive ? t("adminMailTemplates.disableTemplate") : t("adminMailTemplates.enableTemplate")}
                    className="flex items-center gap-2"
                  >
                    <span dir="ltr" className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors duration-200 ${tmpl.isActive ? "bg-emerald-500" : "bg-bg-3 border border-line-2"}`}>
                      <span className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${tmpl.isActive ? "translate-x-[16px]" : "translate-x-[3px]"}`} />
                    </span>
                    <span className="text-[11px] text-fg-3">{tmpl.isActive ? t("adminMailTemplates.disable") : t("adminMailTemplates.enable")}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setHtmlPreviewTemplate(tmpl)} title="Preview" className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-bg-3 text-fg-3 hover:text-fg-0 transition-colors"><Icon name="eye" size={14} /></button>
                    <button onClick={() => { setPreviewId(tmpl.id); setPreviewEmail(""); }} title="Send test email" className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-bg-3 text-fg-3 hover:text-fg-0 transition-colors"><Icon name="mail" size={14} /></button>
                    <button onClick={() => openEdit(tmpl)} title="Edit" className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-bg-3 text-fg-3 hover:text-fg-0 transition-colors"><Icon name="pencil" size={14} /></button>
                  </div>
                </div>
              </div>

            </div>
          ))}

          {templates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-bg-2 border border-line flex items-center justify-center mb-3">
                <Icon name="mail" size={22} className="text-fg-3" />
              </div>
              <p className="text-[13px] font-medium text-fg-1">{t("adminMailTemplates.noTemplates")}</p>
              <p className="text-[12px] text-fg-3 mt-0.5">{t("adminMailTemplates.noTemplatesHint")}</p>
            </div>
          )}
        </div>
      </section>

      {/* Template form modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full sm:max-w-[760px] max-h-[90vh] sm:max-h-[92vh] bg-bg-0 rounded-t-2xl sm:rounded-2xl border-t sm:border border-line shadow-2xl overflow-hidden flex flex-col">

            {/* Mobile pill */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-line-2" />
            </div>

            {/* Modal header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-line shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent-line flex items-center justify-center">
                  <Icon name="mail" size={16} className="text-accent" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-fg-0">{editing ? t("adminMailTemplates.editTemplate") : t("adminMailTemplates.newTemplate")}</div>
                  <div className="text-[11px] text-fg-3">{editing ? t("adminMailTemplates.updateTemplateDesc") : t("adminMailTemplates.addTemplateDesc")}</div>
                </div>
              </div>
              <button
                onClick={closeForm}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-2 text-fg-3 hover:text-fg-0 transition-colors"
              >
                <Icon name="close" size={14} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-4 sm:px-6 py-5 space-y-5 overflow-y-auto flex-1">

                {/* Row 1: Name + Key */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-fg-2">{t("adminMailTemplates.labelName")}</label>
                    <Input
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Forgot Password"
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-fg-2">
                      {t("adminMailTemplates.labelKey")} <span className="text-fg-4 font-normal">{t("adminMailTemplates.labelKeyHint")}</span>
                    </label>
                    <Input
                      value={form.key}
                      onChange={(e) => handleKeyChange(e.target.value)}
                      placeholder="e.g. forgot_password"
                      required
                      disabled={!!editing}
                      className="w-full font-mono text-[12px]"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-fg-2">{t("adminMailTemplates.labelSubject")}</label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Reset your {{brand_name}} password"
                    required
                    className="w-full"
                  />
                </div>

                {/* Available variables */}
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-fg-2">
                    {t("adminMailTemplates.labelVariables")} <span className="text-fg-4 font-normal">{t("adminMailTemplates.labelVariablesHint")}</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-bg-2 border border-line-2">
                    {MAIL_VARS.map((v) => (
                      <VarChip key={v} variable={v} onClick={insertVar} />
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-fg-2">
                    {t("adminMailTemplates.labelBody")} <span className="text-fg-4 font-normal">{t("adminMailTemplates.labelBodyHtml")}</span>
                  </label>
                  <textarea
                    ref={bodyRef}
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder="<div style='font-family:sans-serif;'>...</div>"
                    required
                    rows={12}
                    className="w-full rounded-lg border border-line-2 bg-bg-1 px-3 py-2.5 text-[12px] text-fg-0 font-mono resize-y focus:outline-none focus:border-accent transition-colors"
                    style={{ minHeight: "300px" }}
                  />
                </div>

                {/* Active toggle */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-fg-2">{t("adminMailTemplates.labelVisibility")}</label>
                  <label
                    className="flex items-center gap-3 cursor-pointer h-10 px-3 rounded-lg border border-line-2 bg-bg-1"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  >
                    <span dir="ltr" className={`relative inline-flex items-center w-10 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.isActive ? "bg-accent" : "bg-bg-3 border border-line-2"}`}>
                      <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${form.isActive ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                    </span>
                    <div>
                      <div className="text-[13px] font-medium text-fg-0">{t("adminMailTemplates.labelActive")}</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-line bg-bg-1 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="inline-flex items-center h-5 px-2 rounded-md bg-bg-3 border border-line-2 text-[10px] font-mono text-fg-2">
                    {form.key || "key"}
                  </span>
                  <span className="text-[12px] text-fg-3">{form.name || "—"}</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="h-10 sm:h-9 flex-1 sm:flex-none px-4 rounded-lg border border-line-2 text-[13px] text-fg-1 hover:bg-bg-2 transition-colors"
                  >
                    {t("adminMailTemplates.cancel")}
                  </button>
                  <Button variant="primary" type="submit" disabled={saving} className="h-10 sm:h-9 flex-1 sm:flex-none">
                    {saving ? t("adminMailTemplates.saving") : editing ? t("adminMailTemplates.saveChanges") : t("adminMailTemplates.createTemplate")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewId && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full sm:max-w-[440px] bg-bg-0 rounded-t-2xl sm:rounded-2xl border-t sm:border border-line shadow-2xl overflow-hidden">
            {/* Mobile pill */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-line-2" />
            </div>
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent-line flex items-center justify-center">
                  <Icon name="mail" size={16} className="text-accent" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-fg-0">{t("adminMailTemplates.sendPreviewTitle")}</div>
                  <div className="text-[11px] text-fg-3">{t("adminMailTemplates.sendPreviewDesc")}</div>
                </div>
              </div>
              <button
                onClick={() => { setPreviewId(null); setPreviewEmail(""); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-2 text-fg-3 hover:text-fg-0 transition-colors"
              >
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-fg-2">{t("adminMailTemplates.labelSendTo")}</label>
                <Input
                  type="email"
                  value={previewEmail}
                  onChange={(e) => setPreviewEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full"
                  autoFocus
                />
              </div>
              <p className="text-[12px] text-fg-3">
                {t("adminMailTemplates.previewNote")}
              </p>
            </div>

            <div className="flex items-center gap-2 px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-line bg-bg-1">
              <button
                type="button"
                onClick={() => { setPreviewId(null); setPreviewEmail(""); }}
                className="flex-1 sm:flex-none h-10 sm:h-9 px-4 rounded-lg border border-line-2 text-[13px] text-fg-1 hover:bg-bg-2 transition-colors"
              >
                {t("adminMailTemplates.cancel")}
              </button>
              <Button
                variant="primary"
                onClick={sendPreview}
                disabled={previewSending || !previewEmail}
                className="flex-1 sm:flex-none h-10 sm:h-9"
              >
                {previewSending ? t("adminMailTemplates.sending") : t("adminMailTemplates.sendPreview")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HTML Preview Drawer */}
      {htmlPreviewTemplate && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:flex-row sm:justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setHtmlPreviewTemplate(null)} />
          <div className="relative z-10 w-full sm:max-w-[640px] h-[90vh] sm:h-full bg-bg-0 sm:border-l border-t sm:border-t-0 border-line shadow-2xl flex flex-col rounded-t-2xl sm:rounded-none">

            {/* Mobile pill */}
            <div className="sm:hidden flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-fg-3/30" />
            </div>

            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-line shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent-line flex items-center justify-center shrink-0">
                  <Icon name="eye" size={15} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-fg-0 truncate">{htmlPreviewTemplate.name}</div>
                  <div className="text-[11px] font-mono text-fg-3 truncate">{htmlPreviewTemplate.key}</div>
                </div>
              </div>
              <button
                onClick={() => setHtmlPreviewTemplate(null)}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-bg-2 text-fg-3 hover:text-fg-0 transition-colors shrink-0"
              >
                <Icon name="close" size={14} />
              </button>
            </div>

            {/* Subject */}
            <div className="px-4 sm:px-5 py-2.5 border-b border-line bg-bg-1 shrink-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.6px] text-fg-3 mb-0.5">{t("adminMailTemplates.subjectLabel")}</div>
              <div className="text-[13px] text-fg-0 font-medium leading-snug">{htmlPreviewTemplate.subject}</div>
            </div>

            {/* Rendered HTML */}
            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={htmlPreviewTemplate.body}
                title="Email preview"
                className="w-full h-full border-0 bg-white"
                sandbox="allow-same-origin"
              />
            </div>

            {/* Mobile footer close button */}
            <div className="sm:hidden px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-line bg-bg-0 shrink-0">
              <button
                onClick={() => setHtmlPreviewTemplate(null)}
                className="w-full h-10 rounded-[8px] border border-line-2 bg-bg-2 text-fg-1 text-[13px] font-medium hover:bg-bg-3 transition-colors"
              >
                {t("adminMailTemplates.closePreview")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title={t("adminMailTemplates.confirmDeleteTitle")}
        description={t("adminMailTemplates.confirmDeleteDesc")}
        confirmLabel={t("adminMailTemplates.confirmDeleteLabel")}
        cancelLabel={t("adminMailTemplates.cancel")}
        variant="danger"
        icon="trash"
        onConfirm={() => confirmId && onDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
