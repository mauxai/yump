"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { toast } from "@/lib/toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { EffectPreset } from "@prisma/client";
import { useT } from "@/lib/i18n";

const ICON_OPTIONS: IconName[] = [
  "sparkles", "sun", "moon", "bolt", "image", "film", "eye", "layers",
  "scissors", "contrast", "droplet", "palette", "paintBucket", "pen",
  "pencil", "faceSmile", "user", "zoomIn", "sliders", "wand", "brush",
  "crop", "airbrush", "smudge", "marker", "eraser", "lasso",
];

const CATEGORY_COLOR_OPTIONS = [
  { label: "Blue",    value: "text-blue-400",    dot: "#60a5fa" },
  { label: "Purple",  value: "text-purple-400",  dot: "#c084fc" },
  { label: "Pink",    value: "text-pink-400",    dot: "#f472b6" },
  { label: "Amber",   value: "text-amber-400",   dot: "#fbbf24" },
  { label: "Emerald", value: "text-emerald-400", dot: "#34d399" },
  { label: "Red",     value: "text-red-400",     dot: "#f87171" },
  { label: "Cyan",    value: "text-cyan-400",    dot: "#22d3ee" },
  { label: "Orange",  value: "text-orange-400",  dot: "#fb923c" },
];

const EMPTY_FORM = {
  label: "", icon: "sparkles" as IconName, prompt: "",
  category: "", categoryColor: "text-blue-400", sortOrder: 0, isActive: true,
};

type FormState = typeof EMPTY_FORM;

// ── Searchable Icon Picker ────────────────────────────────────────────────────
function IconPicker({ value, onChange }: { value: IconName; onChange: (v: IconName) => void }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = ICON_OPTIONS.filter((i) => i.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-10 flex items-center gap-3 px-3 rounded-lg border border-line-2 bg-bg-1 hover:border-accent transition-colors text-left"
      >
        <span className="w-7 h-7 flex items-center justify-center rounded-md bg-bg-3 text-fg-1 shrink-0">
          <Icon name={value} size={15} />
        </span>
        <span className="flex-1 text-[13px] text-fg-0">{value}</span>
        <Icon name="arrowRight" size={12} className="text-fg-3 rotate-90 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-bg-1 border border-line rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-line">
            <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-bg-2 border border-line-2">
              <Icon name="search" size={13} className="text-fg-3 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("adminEffects.searchIcons")}
                className="flex-1 bg-transparent text-[13px] text-fg-0 placeholder:text-fg-3 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 max-h-[220px] overflow-y-auto">
            {filtered.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => { onChange(icon); setOpen(false); setSearch(""); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  value === icon
                    ? "bg-accent-soft border border-accent-line text-accent"
                    : "hover:bg-bg-2 text-fg-2 hover:text-fg-0"
                }`}
              >
                <Icon name={icon} size={16} />
                <span className="text-[9px] font-medium truncate w-full text-center">{icon}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-4 py-6 text-center text-[12px] text-fg-3">{t("adminEffects.noIconsFound")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category Picker ───────────────────────────────────────────────────────────
function CategoryPicker({
  value,
  onChange,
  existing,
}: {
  value: string;
  onChange: (v: string) => void;
  existing: string[];
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (!search.trim()) setSearch(value);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [search, value]);

  const filtered = existing.filter((c) => c.toLowerCase().includes(search.toLowerCase()));
  const isNew = search.trim() && !existing.some((c) => c.toLowerCase() === search.trim().toLowerCase());

  function select(cat: string) {
    onChange(cat);
    setSearch(cat);
    setOpen(false);
  }

  function confirmNew() {
    if (search.trim()) { select(search.trim()); }
  }

  return (
    <div ref={ref} className="relative">
      <div
        className={`w-full h-10 flex items-center gap-2 px-3 rounded-lg border bg-bg-1 transition-colors ${open ? "border-accent" : "border-line-2 hover:border-accent"}`}
      >
        <Icon name="folder" size={14} className="text-fg-3 shrink-0" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); isNew ? confirmNew() : filtered[0] && select(filtered[0]); } if (e.key === "Escape") setOpen(false); }}
          placeholder="e.g. Enhance"
          className="flex-1 bg-transparent text-[13px] text-fg-0 placeholder:text-fg-3 outline-none"
        />
        {value && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-soft border border-accent-line text-accent font-medium shrink-0">
            {isNew ? "New" : "Existing"}
          </span>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-bg-1 border border-line rounded-xl shadow-lg overflow-hidden">
          {filtered.length > 0 && (
            <div className="p-1.5">
              <div className="text-[10px] font-semibold text-fg-3 uppercase tracking-wide px-2 py-1">{t("adminEffects.existingCategories")}</div>
              {filtered.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => select(cat)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors text-left ${
                    value === cat ? "bg-accent-soft text-accent" : "hover:bg-bg-2 text-fg-1"
                  }`}
                >
                  <Icon name="folder" size={13} className="text-fg-3 shrink-0" />
                  {cat}
                  {value === cat && <Icon name="sparkles" size={11} className="ml-auto text-accent" />}
                </button>
              ))}
            </div>
          )}

          {isNew && (
            <div className={`${filtered.length > 0 ? "border-t border-line" : ""} p-1.5`}>
              <div className="text-[10px] font-semibold text-fg-3 uppercase tracking-wide px-2 py-1">{t("adminEffects.createNew")}</div>
              <button
                type="button"
                onClick={confirmNew}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-left hover:bg-accent-soft hover:text-accent transition-colors text-fg-1"
              >
                <Icon name="plus" size={13} className="text-accent shrink-0" />
                <span>Create <strong>&quot;{search.trim()}&quot;</strong></span>
              </button>
            </div>
          )}

          {filtered.length === 0 && !isNew && (
            <div className="px-4 py-6 text-center text-[12px] text-fg-3">{t("adminEffects.typeToCreate")}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Color Picker ──────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = CATEGORY_COLOR_OPTIONS.find((o) => o.value === value) ?? CATEGORY_COLOR_OPTIONS[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-10 flex items-center gap-3 px-3 rounded-lg border border-line-2 bg-bg-1 hover:border-accent transition-colors text-left"
      >
        <span className="w-4 h-4 rounded-full shrink-0 border border-white/20" style={{ background: selected.dot }} />
        <span className="flex-1 text-[13px] text-fg-0">{selected.label}</span>
        <Icon name="arrowRight" size={12} className="text-fg-3 rotate-90 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-bg-1 border border-line rounded-xl shadow-lg overflow-hidden p-2">
          <div className="grid grid-cols-2 gap-1">
            {CATEGORY_COLOR_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  value === o.value
                    ? "bg-accent-soft border border-accent-line text-accent"
                    : "hover:bg-bg-2 text-fg-1"
                }`}
              >
                <span className="w-3 h-3 rounded-full shrink-0 border border-white/20" style={{ background: o.dot }} />
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function EffectsManager({ initial }: { initial: EffectPreset[] }) {
  const { t } = useT();
  const router = useRouter();
  const [presets, setPresets] = useState<EffectPreset[]>(initial);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [viewPreset, setViewPreset] = useState<EffectPreset | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const categories = Array.from(new Set(presets.map((p) => p.category)));

  function openCreate() { setForm(EMPTY_FORM); setEditing(null); setShowForm(true); }

  function openEdit(p: EffectPreset) {
    setForm({
      label: p.label, icon: p.icon as IconName, prompt: p.prompt,
      category: p.category, categoryColor: p.categoryColor,
      sortOrder: p.sortOrder, isActive: p.isActive,
    });
    setEditing(p.id);
    setShowForm(true);
    toast.info(`${t("adminEffects.toastEditing")} "${p.label}"`, t("adminEffects.toastEditingDesc"));
  }

  function closeForm() { setShowForm(false); setEditing(null); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading(editing ? t("adminEffects.toastSavingEdit") : t("adminEffects.toastSavingCreate"), "");
    try {
      const res = await fetch(
        editing ? `/api/admin/effects/${editing}` : "/api/admin/effects",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
        },
      );
      const data = await res.json();
      if (!res.ok) { toast.resolve(toastId, "error", data.error ?? t("adminEffects.toastFailed")); return; }
      toast.resolve(toastId, "success", editing ? t("adminEffects.toastUpdated") : t("adminEffects.toastCreated"));
      closeForm();
      router.refresh();
      if (editing) {
        setPresets((prev) => prev.map((p) => p.id === editing ? { ...p, ...data.preset } : p));
      } else {
        setPresets((prev) => [...prev, data.preset]);
      }
    } catch (err) {
      toast.resolve(toastId, "error", t("adminEffects.toastRequestFailed"), err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: EffectPreset) {
    const toastId = toast.loading(t("adminEffects.toastUpdating"), "");
    try {
      const res = await fetch(`/api/admin/effects/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      const data = await res.json();
      if (!res.ok) { toast.resolve(toastId, "error", data.error ?? t("adminEffects.toastFailed")); return; }
      toast.resolve(toastId, "success", p.isActive ? t("adminEffects.toastDisabled") : t("adminEffects.toastEnabled"));
      setPresets((prev) => prev.map((x) => x.id === p.id ? { ...x, isActive: !p.isActive } : x));
    } catch {
      toast.resolve(toastId, "error", t("adminEffects.toastRequestFailed"));
    }
  }

  const onDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent, targetId: string, _targetIndex: number) => {
    e.preventDefault();
    setDragId(null);
    setDragOverId(null);
    if (!dragId || dragId === targetId) return;

    // Reorder in state
    const next = [...presets];
    const fromIdx = next.findIndex((p) => p.id === dragId);
    const toIdx = next.findIndex((p) => p.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);

    // Assign sequential sortOrder
    const reordered = next.map((p, i) => ({ ...p, sortOrder: i }));
    setPresets(reordered);

    // Persist
    const toastId = toast.loading(t("adminEffects.toastSavingOrder"), "");
    try {
      const res = await fetch("/api/admin/effects/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map((p) => ({ id: p.id, sortOrder: p.sortOrder })) }),
      });
      if (!res.ok) {
        toast.resolve(toastId, "error", t("adminEffects.toastOrderFailed"));
        setPresets(presets);
      } else {
        toast.resolve(toastId, "success", t("adminEffects.toastOrderSaved"));
      }
    } catch {
      toast.resolve(toastId, "error", t("adminEffects.toastOrderFailed"));
      setPresets(presets);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId, presets, t]);

  const onDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverId(null);
  }, []);

  async function onDelete(id: string) {
    setDeleting(id);
    const toastId = toast.loading(t("adminEffects.toastDeleting"), "");
    try {
      const res = await fetch(`/api/admin/effects/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.resolve(toastId, "error", t("adminEffects.toastFailedDelete")); return; }
      toast.resolve(toastId, "success", t("adminEffects.toastDeleted"));
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.resolve(toastId, "error", t("adminEffects.toastRequestFailed"));
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  }

  const filtered = filterCat === "all" ? presets : presets.filter((p) => p.category === filterCat);
  const colorDot = (colorClass: string) =>
    CATEGORY_COLOR_OPTIONS.find((o) => o.value === colorClass)?.dot ?? "#888";

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-10">

      {/* Header */}
      <div className="mb-5 sm:mb-8 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">{t("adminEffects.breadcrumb")}</div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">{t("adminEffects.title")}</h1>
          <p className="hidden sm:block text-[13px] text-fg-2 mt-1 max-w-[560px]">
            {t("adminEffects.subtitle")}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate} className="shrink-0">
          <Icon name="plus" size={14} />
          <span className="hidden sm:inline">{t("adminEffects.newEffect")}</span>
          <span className="sm:hidden">{t("adminEffects.new")}</span>
        </Button>
      </div>

      {/* Slide-in form panel */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full sm:max-w-[640px] bg-bg-0 rounded-t-2xl sm:rounded-2xl border-t sm:border border-line shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Mobile pill handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-line-2" />
            </div>

            {/* Modal header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-line shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent-line flex items-center justify-center">
                  <Icon name={form.icon} size={16} className="text-accent" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-fg-0">{editing ? t("adminEffects.editEffect") : t("adminEffects.addNewEffect")}</div>
                  <div className="text-[11px] text-fg-3">{editing ? t("adminEffects.updatePreset") : t("adminEffects.addPreset")}</div>
                </div>
              </div>
              <button onClick={closeForm} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-2 text-fg-3 hover:text-fg-0 transition-colors">
                <Icon name="close" size={14} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-4 sm:px-6 py-5 space-y-5 overflow-y-auto flex-1">

                {/* Row 1: Label + Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-fg-2">{t("adminEffects.labelLabel")}</label>
                    <Input
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="e.g. Enhance Quality"
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-fg-2">{t("adminEffects.labelCategory")}</label>
                    <CategoryPicker value={form.category} onChange={(v) => setForm({ ...form, category: v })} existing={categories} />
                  </div>
                </div>

                {/* Row 2: Icon + Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-fg-2">{t("adminEffects.labelIcon")}</label>
                    <IconPicker value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-fg-2">{t("adminEffects.labelCategoryColor")}</label>
                    <ColorPicker value={form.categoryColor} onChange={(v) => setForm({ ...form, categoryColor: v })} />
                  </div>
                </div>

                {/* Prompt */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-fg-2">{t("adminEffects.labelPrompt")}</label>
                  <textarea
                    value={form.prompt}
                    onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                    placeholder="Full prompt sent to the AI when this effect is applied…"
                    required
                    rows={4}
                    className="w-full rounded-lg border border-line-2 bg-bg-1 px-3 py-2.5 text-[13px] text-fg-0 resize-none focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Row 3: Sort order + Active toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-fg-2">{t("adminEffects.labelSortOrder")}</label>
                    <Input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-fg-2">{t("adminEffects.labelVisibility")}</label>
                    <label className="flex items-center gap-3 cursor-pointer h-10 px-3 rounded-lg border border-line-2 bg-bg-1" onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                      <span dir="ltr" className={`relative inline-flex items-center w-10 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.isActive ? "bg-accent" : "bg-bg-3 border border-line-2"}`}>
                        <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${form.isActive ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                      </span>
                      <div>
                        <div className="text-[13px] font-medium text-fg-0">{t("adminEffects.labelActive")}</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-line bg-bg-1 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${form.categoryColor}`}>
                    <Icon name={form.icon} size={13} />
                  </div>
                  <span className="text-[12px] text-fg-3">
                    {t("adminEffects.previewLabel")} <span className="text-fg-1 font-medium">{form.label || "—"}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={closeForm}
                    className="flex-1 sm:flex-none h-10 sm:h-9 px-4 rounded-lg border border-line-2 text-[13px] text-fg-1 hover:bg-bg-2 transition-colors">
                    {t("adminEffects.cancel")}
                  </button>
                  <Button variant="primary" type="submit" disabled={saving} className="flex-1 sm:flex-none">
                    {saving ? t("adminEffects.saving") : editing ? t("adminEffects.saveChanges") : t("adminEffects.createEffect")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
        {[
          { label: t("adminEffects.statTotal"),      value: presets.length, icon: "sparkles" as IconName },
          { label: t("adminEffects.statActive"),     value: presets.filter((p) => p.isActive).length,  icon: "eye" as IconName },
          { label: t("adminEffects.statCategories"), value: categories.length, icon: "layers" as IconName },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex w-9 h-9 rounded-lg bg-accent-soft border border-accent-line items-center justify-center shrink-0">
              <Icon name={s.icon} size={16} className="text-accent" />
            </div>
            <div>
              <div className="text-[18px] sm:text-[22px] font-semibold mono text-fg-0 leading-none">{s.value}</div>
              <div className="text-[10px] sm:text-[11px] text-fg-3 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-0.5">
        <button onClick={() => setFilterCat("all")}
          className={`h-7 px-3 rounded-full text-[12px] font-medium transition-colors shrink-0 ${
            filterCat === "all" ? "bg-accent text-[var(--accent-fg)]" : "bg-bg-2 text-fg-2 hover:bg-bg-3"
          }`}>
          All ({presets.length})
        </button>
        {categories.map((cat) => {
          const color = presets.find((p) => p.category === cat)?.categoryColor ?? "text-fg-2";
          return (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`h-7 px-3 rounded-full text-[12px] font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                filterCat === cat ? "bg-accent text-[var(--accent-fg)]" : "bg-bg-2 text-fg-2 hover:bg-bg-3"
              }`}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colorDot(color) }} />
              {cat} ({presets.filter((p) => p.category === cat).length})
            </button>
          );
        })}
      </div>

      {/* Presets list */}
      <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
        <div className="divide-y divide-line">
          {filtered.map((p, i) => (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => onDragStart(e, p.id)}
              onDragOver={(e) => onDragOver(e, p.id)}
              onDrop={(e) => onDrop(e, p.id, i)}
              onDragEnd={onDragEnd}
              className={`transition-colors cursor-default select-none
                ${dragId === p.id ? "opacity-40 bg-bg-2" : ""}
                ${dragOverId === p.id && dragId !== p.id ? "border-t-2 border-accent bg-accent-soft" : "hover:bg-bg-2"}
                ${!p.isActive ? "opacity-50" : ""}
              `}
            >
              {/* ── Desktop row (sm+) ── */}
              <div className="hidden sm:flex items-center gap-4 px-5 py-3">
                {/* Drag handle */}
                <div className="shrink-0 cursor-grab active:cursor-grabbing text-fg-3 hover:text-fg-1 transition-colors" title={t("adminEffects.dragToReorder")}>
                  <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                    <circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/>
                    <circle cx="3" cy="8" r="1.5"/><circle cx="9" cy="8" r="1.5"/>
                    <circle cx="3" cy="13" r="1.5"/><circle cx="9" cy="13" r="1.5"/>
                  </svg>
                </div>

                {/* Icon bubble */}
                <div className="w-9 h-9 rounded-lg bg-bg-2 border border-line flex items-center justify-center shrink-0">
                  <Icon name={p.icon as IconName} size={16} className={p.isActive ? p.categoryColor : "text-fg-3"} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-fg-0">{p.label}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                      style={{ background: colorDot(p.categoryColor) + "20", color: colorDot(p.categoryColor) }}>
                      <span className="w-1 h-1 rounded-full" style={{ background: colorDot(p.categoryColor) }} />
                      {p.category}
                    </span>
                  </div>
                  <p className="text-[12px] text-fg-3 mt-0.5 truncate max-w-[500px]">{p.prompt}</p>
                </div>

                {/* Sort */}
                <span className="mono text-[11px] text-fg-3 w-6 text-center shrink-0">{p.sortOrder}</span>

                {/* Toggle switch */}
                <button
                  onClick={() => toggleActive(p)}
                  title={p.isActive ? t("adminEffects.statusActive") : t("adminEffects.statusInactive")}
                  className="shrink-0 flex items-center gap-2 group"
                >
                  <span dir="ltr" className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors duration-200 ${p.isActive ? "bg-accent" : "bg-bg-3 border border-line-2"}`}>
                    <span className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${p.isActive ? "translate-x-[16px]" : "translate-x-[3px]"}`} />
                  </span>
                  <span className={`text-[11px] font-medium w-12 ${p.isActive ? "text-accent" : "text-fg-3"}`}>
                    {p.isActive ? t("adminEffects.statusActive") : t("adminEffects.statusInactive")}
                  </span>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => setViewPreset(p)} title="View details"
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-bg-3 text-fg-3 hover:text-fg-0 transition-colors">
                    <Icon name="eye" size={13} />
                  </button>
                  <button onClick={() => openEdit(p)} title="Edit"
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-bg-3 text-fg-3 hover:text-fg-0 transition-colors">
                    <Icon name="pencil" size={13} />
                  </button>
                  <div className="w-px h-4 bg-line mx-0.5" />
                  <button onClick={() => setConfirmId(p.id)} disabled={deleting === p.id} title="Delete"
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--danger)]/10 text-fg-3 hover:text-[var(--danger)] transition-colors disabled:opacity-30">
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>

              {/* ── Mobile card (below sm) ── */}
              <div className="sm:hidden px-4 py-3 flex items-center gap-3">
                {/* Icon bubble */}
                <div className="w-10 h-10 rounded-xl bg-bg-2 border border-line flex items-center justify-center shrink-0">
                  <Icon name={p.icon as IconName} size={18} className={p.isActive ? p.categoryColor : "text-fg-3"} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-medium text-fg-0">{p.label}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                      style={{ background: colorDot(p.categoryColor) + "20", color: colorDot(p.categoryColor) }}>
                      {p.category}
                    </span>
                  </div>
                  <p className="text-[12px] text-fg-3 mt-0.5 truncate">{p.prompt}</p>
                </div>

                {/* Toggle + actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(p)} title={p.isActive ? t("adminEffects.statusActive") : t("adminEffects.statusInactive")}
                    className="shrink-0">
                    <span dir="ltr" className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors duration-200 ${p.isActive ? "bg-emerald-500" : "bg-bg-3 border border-line-2"}`}>
                      <span className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${p.isActive ? "translate-x-[16px]" : "translate-x-[3px]"}`} />
                    </span>
                  </button>
                  <button onClick={() => setViewPreset(p)} title="View"
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg-3 text-fg-3 hover:text-fg-0 transition-colors">
                    <Icon name="eye" size={14} />
                  </button>
                  <button onClick={() => openEdit(p)} title="Edit"
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg-3 text-fg-3 hover:text-fg-0 transition-colors">
                    <Icon name="pencil" size={14} />
                  </button>
                  <button onClick={() => setConfirmId(p.id)} disabled={deleting === p.id} title="Delete"
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--danger)]/10 text-fg-3 hover:text-[var(--danger)] transition-colors disabled:opacity-30">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-bg-2 border border-line flex items-center justify-center mb-3">
                <Icon name="sparkles" size={22} className="text-fg-3" />
              </div>
              <p className="text-[13px] font-medium text-fg-1">{t("adminEffects.noEffects")}</p>
              <p className="text-[12px] text-fg-3 mt-0.5">{t("adminEffects.noEffectsHint")}</p>
            </div>
          )}
        </div>
      </section>

      {/* Detail drawer — bottom sheet on mobile, right panel on desktop */}
      {viewPreset && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end sm:flex-row sm:justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewPreset(null)} />

          {/* Drawer */}
          <div className="relative z-10 w-full sm:max-w-[400px] sm:h-full bg-bg-0 sm:border-l border-t sm:border-t-0 border-line flex flex-col shadow-2xl rounded-t-2xl sm:rounded-none max-h-[90vh] sm:max-h-full">

            {/* Mobile pill handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-line-2" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-line shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-line bg-bg-2 flex items-center justify-center">
                  <Icon name={viewPreset.icon as IconName} size={18} className={viewPreset.categoryColor} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-fg-0">{viewPreset.label}</div>
                  <div className={`text-[11px] font-semibold uppercase tracking-wide ${viewPreset.categoryColor}`}>{viewPreset.category}</div>
                </div>
              </div>
              <button onClick={() => setViewPreset(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-2 text-fg-3 hover:text-fg-0 transition-colors">
                <Icon name="close" size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">

              {/* Status toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-line bg-bg-1">
                <div>
                  <div className="text-[13px] font-medium text-fg-0">{t("adminEffects.statusLabel")}</div>
                  <div className="text-[11px] text-fg-3 mt-0.5">
                    {viewPreset.isActive ? t("adminEffects.visibleDesc") : t("adminEffects.hiddenDesc")}
                  </div>
                </div>
                <button
                  onClick={() => { toggleActive(viewPreset); setViewPreset({ ...viewPreset, isActive: !viewPreset.isActive }); }}
                  className="shrink-0"
                >
                  <span dir="ltr" className={`relative inline-flex items-center w-10 h-6 rounded-full transition-colors duration-200 ${viewPreset.isActive ? "bg-accent" : "bg-bg-3 border border-line-2"}`}>
                    <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${viewPreset.isActive ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                  </span>
                </button>
              </div>

              {/* Prompt */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-fg-3 uppercase tracking-wide">{t("adminEffects.aiPromptLabel")}</div>
                <div className="rounded-xl border border-line bg-bg-1 p-4 text-[13px] text-fg-1 leading-relaxed">
                  {viewPreset.prompt}
                </div>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-bg-1 px-4 py-3">
                  <div className="text-[11px] text-fg-3 uppercase tracking-wide mb-1">{t("adminEffects.iconLabel")}</div>
                  <div className="flex items-center gap-2">
                    <Icon name={viewPreset.icon as IconName} size={14} className="text-fg-1" />
                    <span className="text-[13px] text-fg-0 mono">{viewPreset.icon}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-bg-1 px-4 py-3">
                  <div className="text-[11px] text-fg-3 uppercase tracking-wide mb-1">{t("adminEffects.sortOrderLabel")}</div>
                  <span className="text-[13px] text-fg-0 mono">{viewPreset.sortOrder}</span>
                </div>
                <div className="col-span-2 rounded-xl border border-line bg-bg-1 px-4 py-3">
                  <div className="text-[11px] text-fg-3 uppercase tracking-wide mb-1">{t("adminEffects.categoryColorLabel")}</div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: colorDot(viewPreset.categoryColor) }} />
                    <span className="text-[13px] text-fg-0 mono">{viewPreset.categoryColor}</span>
                  </div>
                </div>
              </div>

              {/* Editor preview */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-fg-3 uppercase tracking-wide">{t("adminEffects.editorPreviewLabel")}</div>
                <div className="rounded-xl border border-line bg-bg-2 p-4">
                  <div className={`text-[10px] font-semibold uppercase tracking-[0.7px] mb-2 ${viewPreset.categoryColor}`}>{viewPreset.category}</div>
                  <button className="flex items-center gap-[6px] px-[8px] py-[7px] rounded-[8px] border bg-bg-1 border-line-2 text-fg-1 w-full max-w-[160px]">
                    <Icon name={viewPreset.icon as IconName} size={14} className="shrink-0" />
                    <span className="text-[11px] font-medium truncate">{viewPreset.label}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-line flex items-center gap-2 shrink-0">
              <Button variant="primary" size="md" onClick={() => { setViewPreset(null); openEdit(viewPreset); }} className="flex-1 h-10 sm:h-9">
                <Icon name="pencil" size={13} />
                {t("adminEffects.editEffectBtn")}
              </Button>
              <button onClick={() => { setViewPreset(null); setConfirmId(viewPreset.id); }}
                className="h-10 sm:h-9 px-3 rounded-lg border border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors">
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title={t("adminEffects.confirmDeleteTitle")}
        description={t("adminEffects.confirmDeleteDesc")}
        confirmLabel={t("adminEffects.confirmDeleteLabel")}
        cancelLabel={t("adminEffects.cancel")}
        variant="danger"
        icon="trash"
        onConfirm={() => confirmId && onDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
