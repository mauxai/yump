"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Button, Input } from "@/components/ui";
import { toast } from "@/lib/toast";
import { updateTemplate } from "../../actions";
import { CategoryCombobox, type CategoryOption } from "../../CategoryCombobox";

type TemplateData = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  prompt: string;
  categoryId: string;
  sortOrder: number;
  isActive: boolean;
};

type ModelOption = { id: string; label: string; modelId: string; isDefault: boolean; provider: string };

export function EditTemplateContent({
  template,
  categories,
  models = [],
}: {
  template: TemplateData;
  categories: CategoryOption[];
  models?: ModelOption[];
}) {
  const router = useRouter();
  const defaultModel = models.find((m) => m.isDefault) ?? models[0] ?? null;
  const [selectedModelId, setSelectedModelId] = useState<string | null>(defaultModel?.id ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState(template.prompt);
  const [title, setTitle] = useState(template.title);
  const [description, setDescription] = useState(template.description ?? "");
  const [categoryId, setCategoryId] = useState(template.categoryId);
  const [sortOrder, setSortOrder] = useState(template.sortOrder);
  const [isActive, setIsActive] = useState(template.isActive);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8 MB."); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  async function generatePrompt() {
    const src = imagePreview ?? template.imageUrl;
    let dataUrl = src;

    // If using the existing imageUrl (not a data URL), fetch and convert
    if (!src.startsWith("data:")) {
      const res = await fetch(src);
      const blob = await res.blob();
      dataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(blob);
      });
    }

    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/templates/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl, modelId: selectedModelId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed.");
      setPrompt(data.prompt);
      toast.success("Prompt regenerated!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI generation failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (!categoryId.trim()) { toast.error("Category is required."); return; }
    if (!prompt.trim()) { toast.error("Prompt is required."); return; }

    setSaving(true);
    setError(null);
    const fd = new FormData();
    if (imageFile) fd.append("image", imageFile);
    fd.append("title", title);
    fd.append("description", description);
    fd.append("prompt", prompt);
    fd.append("categoryId", categoryId);
    fd.append("sortOrder", String(sortOrder));
    fd.append("isActive", isActive ? "1" : "0");

    const res = await updateTemplate(template.id, fd);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      setSaving(false);
    } else {
      toast.success("Template updated.");
      router.push("/admin/templates");
    }
  }

  const currentImage = imagePreview ?? template.imageUrl;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/templates"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-line bg-bg-1 hover:bg-bg-2 transition-colors text-fg-2"
        >
          <Icon name="arrowLeft" size={14} />
        </Link>
        <div>
          <h1 className="text-[20px] font-bold text-fg-0">Edit Template</h1>
          <p className="text-[12px] text-fg-2 mt-0.5">{template.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Left — Image + Prompt */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-line bg-bg-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <span className="text-[13px] font-semibold text-fg-0">Template Image</span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-[12px] text-accent hover:underline flex items-center gap-1"
              >
                <Icon name="upload" size={12} /> Replace image
              </button>
            </div>
            <div className="p-4">
              <div className="relative rounded-lg overflow-hidden bg-bg-2 h-[220px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentImage} alt={title} className="w-full h-full object-contain" />
                {imageFile && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full bg-accent text-[var(--accent-fg)] text-[10px] font-medium">
                      New image
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-bg-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold text-fg-0 shrink-0">Generation Prompt</span>

              <div className="flex items-center gap-2 shrink-0">
                {/* Model selector */}
                {models.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-2 border border-line-2 shrink-0">
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
                  disabled={generating}
                  className="w-[140px] justify-center shrink-0"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Icon name="sparkles" size={13} />
                      Regenerate with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="w-full bg-bg-2 border border-line-2 rounded-lg px-3 py-2.5 text-[13px] text-fg-0 placeholder:text-fg-3 outline-none focus:border-accent-line transition-colors resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-[rgba(var(--danger-rgb),0.08)] border border-[rgba(var(--danger-rgb),0.2)] px-4 py-3 text-[13px] text-[var(--danger)]">
              {error}
            </div>
          )}
        </div>

        {/* Right — Metadata */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-line bg-bg-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <span className="text-[13px] font-semibold text-fg-0">Template Details</span>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-fg-1 mb-1.5">Title <span className="text-[var(--danger)]">*</span></label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Template name" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-fg-1 mb-1.5">Description <span className="text-fg-3">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-bg-2 border border-line-2 rounded-lg px-3 py-2 text-[13px] text-fg-0 placeholder:text-fg-3 outline-none focus:border-accent-line transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-fg-1 mb-1.5">Category <span className="text-[var(--danger)]">*</span></label>
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
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-9 h-5 rounded-full transition-colors ${isActive ? "bg-accent" : "bg-bg-3"}`}
                  onClick={() => setIsActive((v) => !v)}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow mt-0.5 transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-[13px] text-fg-0">Active (visible to users)</span>
              </label>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={saving || generating || !title.trim() || !categoryId.trim() || !prompt.trim()}
            className="w-full"
          >
            {saving ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <Icon name="download" size={14} />
                Save Changes
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
