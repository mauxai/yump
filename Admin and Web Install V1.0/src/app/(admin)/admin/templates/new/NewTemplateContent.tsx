"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Button, Input } from "@/components/ui";
import { toast } from "@/lib/toast";
import { createTemplate } from "../actions";
import { CategoryCombobox, type CategoryOption } from "../CategoryCombobox";

type ModelOption = { id: string; label: string; modelId: string; isDefault: boolean; provider: string };

export function NewTemplateContent({
  categories,
  models = [],
}: {
  categories: CategoryOption[];
  models?: ModelOption[];
}) {
  const router = useRouter();
  const defaultModel =
    models.find((m) => m.isDefault) ??
    models[0] ??
    null;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(defaultModel?.id ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8 MB."); return; }
    setImageFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  async function generatePrompt() {
    if (!imagePreview) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/templates/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: imagePreview, modelId: selectedModelId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to generate prompt.");
      setPrompt(data.prompt);
      toast.success("Prompt generated successfully!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI generation failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!imageFile) { toast.error("Upload an image first."); return; }
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (!categoryId.trim()) { toast.error("Category is required."); return; }
    if (!prompt.trim()) { toast.error("Prompt is required."); return; }

    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.append("image", imageFile);
    fd.append("title", title);
    fd.append("description", description);
    fd.append("prompt", prompt);
    fd.append("categoryId", categoryId);
    fd.append("sortOrder", String(sortOrder));
    fd.append("isActive", isActive ? "1" : "0");

    const res = await createTemplate(fd);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      setSaving(false);
    } else {
      toast.success("Template created.");
      router.push("/admin/templates");
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/templates"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-line bg-bg-1 hover:bg-bg-2 transition-colors text-fg-2 shrink-0"
        >
          <Icon name="arrowLeft" size={14} />
        </Link>
        <div>
          <h1 className="text-[20px] font-bold text-fg-0">New Template</h1>
          <p className="text-[12px] text-fg-2 mt-0.5">Upload an image → AI generates prompt → save as template</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-5">

          {/* Step 1 — Image upload */}
          <div className="rounded-xl border border-line bg-bg-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-[var(--accent-fg)] text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
              <span className="text-[13px] font-semibold text-fg-0">Upload Template Image</span>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); setPrompt(""); }}
                  className="ml-auto flex items-center gap-1 text-[11px] text-fg-3 hover:text-danger transition-colors"
                >
                  <Icon name="close" size={11} />
                  Remove
                </button>
              )}
            </div>
            <div className="p-4">
              {imagePreview ? (
                <div className="rounded-lg overflow-hidden bg-bg-2 w-full h-[220px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-xl w-full h-[220px] flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                    dragOver ? "border-accent bg-accent-soft" : "border-line-2 hover:border-accent hover:bg-bg-2"
                  }`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleImageSelect(file);
                  }}
                >
                  <div className="w-12 h-12 rounded-xl bg-bg-2 border border-line flex items-center justify-center">
                    <Icon name="upload" size={22} className="text-fg-3" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[14px] font-medium text-fg-0">Drop image here or click to browse</p>
                    <p className="text-[12px] text-fg-2 mt-1">JPEG, PNG, WebP — max 8 MB</p>
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
              />
            </div>
          </div>

          {/* Step 2 — AI Prompt */}
          <div className="rounded-xl border border-line bg-bg-1 overflow-hidden">
            {/* Header row */}
            <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-accent text-[var(--accent-fg)] text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                <span className="text-[13px] font-semibold text-fg-0 truncate">AI-Generated Prompt</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {models.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-2 border border-line-2 shrink-0">
                    <Icon name="cpu" size={11} className="text-fg-3 shrink-0" />
                    <select
                      value={selectedModelId ?? ""}
                      onChange={(e) => setSelectedModelId(e.target.value || null)}
                      className="bg-transparent text-[11px] text-fg-1 outline-none appearance-none cursor-pointer pr-4 w-[130px]"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236a6e77' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0px center",
                      }}
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}{m.isDefault ? " ★" : ""}{m.provider !== "google" ? " (text only)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={generatePrompt}
                  disabled={!imagePreview || generating}
                  className="w-[116px] justify-center shrink-0"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Icon name="sparkles" size={13} />
                      {prompt ? "Regenerate" : "Generate"}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Prompt body — always rendered to prevent DOM remount blink */}
            <div className="p-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  generating
                    ? "AI is analyzing your image…"
                    : !imagePreview
                    ? "Upload an image first, then click Generate…"
                    : "Click 'Generate' or write the prompt manually…"
                }
                rows={5}
                disabled={generating}
                className="w-full bg-bg-2 border border-line-2 rounded-lg px-3 py-2.5 text-[13px] text-fg-0 placeholder:text-fg-3 outline-none focus:border-accent-line transition-colors resize-none disabled:opacity-60"
              />
              {prompt && !generating && (
                <p className="text-[11px] text-fg-3 mt-1.5">You can edit the prompt before saving.</p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-[rgba(var(--danger-rgb),0.08)] border border-[rgba(var(--danger-rgb),0.2)] px-4 py-3 text-[13px] text-[var(--danger)]">
              {error}
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-line bg-bg-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-[var(--accent-fg)] text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
              <span className="text-[13px] font-semibold text-fg-0">Template Details</span>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-fg-1 mb-1.5">
                  Title <span className="text-[var(--danger)]">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Golden Hour Portrait"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-fg-1 mb-1.5">
                  Description <span className="text-fg-3 font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description shown to users…"
                  rows={3}
                  className="w-full bg-bg-2 border border-line-2 rounded-lg px-3 py-2 text-[13px] text-fg-0 placeholder:text-fg-3 outline-none focus:border-accent-line transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-fg-1 mb-1.5">
                  Category <span className="text-[var(--danger)]">*</span>
                </label>
                <CategoryCombobox
                  value={categoryId}
                  onChange={setCategoryId}
                  categories={categories}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-fg-1 mb-1.5">Sort Order</label>
                <Input
                  type="number"
                  value={String(sortOrder)}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="text-[11px] text-fg-3 mt-1">Lower numbers appear first.</p>
              </div>

              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setIsActive((v) => !v)}
              >
                <div className={`w-9 h-5 rounded-full transition-colors shrink-0 ${isActive ? "bg-accent" : "bg-bg-3"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow mt-0.5 transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-[13px] text-fg-0 select-none">Active (visible to users)</span>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={saving || generating || !imageFile || !title.trim() || !categoryId.trim() || !prompt.trim()}
            className="w-full"
          >
            {saving ? (
              <>
                <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <Icon name="download" size={14} />
                Save Template
              </>
            )}
          </Button>

          <Link href="/admin/templates">
            <Button variant="ghost" size="md" className="w-full">Cancel</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
