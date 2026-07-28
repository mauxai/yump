"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/Icon";
import { createCategory, deleteCategory } from "./actions";

export type CategoryOption = { id: string; name: string };

interface Props {
  value: string;           // selected categoryId
  onChange: (id: string) => void;
  categories: CategoryOption[];
}

export function CategoryCombobox({ value, onChange, categories: initialCategories }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState(initialCategories);
  const [confirmDelete, setConfirmDelete] = useState<CategoryOption | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = categories.find((c) => c.id === value) ?? null;

  // Keep search text in sync with selected label
  useEffect(() => { setSearch(selected?.name ?? ""); }, [value, selected?.name]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch(selected?.name ?? "");
        setConfirmDelete(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected?.name]);

  const q = search.trim().toLowerCase();
  const filtered = categories.filter((c) => c.name.toLowerCase().includes(q));
  const exactMatch = categories.some((c) => c.name.toLowerCase() === q);
  const canCreate = q.length > 0 && !exactMatch;

  function select(cat: CategoryOption) {
    onChange(cat.id);
    setSearch(cat.name);
    setOpen(false);
    setConfirmDelete(null);
  }

  async function confirmAndDelete() {
    const cat = confirmDelete;
    if (!cat) return;
    setConfirmDelete(null);
    setDeletingId(cat.id);
    try {
      const res = await deleteCategory(cat.id);
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        if (value === cat.id) { onChange(""); setSearch(""); }
      } else {
        console.error("[deleteCategory] failed:", res.error);
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function createAndSelect() {
    const newName = search.trim();
    if (!newName) return;
    const res = await createCategory(newName);
    if (res.ok) {
      const newCat: CategoryOption = { id: res.id, name: res.name };
      setCategories((prev) =>
        prev.some((c) => c.id === newCat.id) ? prev : [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name))
      );
      select(newCat);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center h-10 px-3 rounded-lg border bg-bg-2 transition-colors ${
          open ? "border-accent-line" : "border-line-2 hover:border-line"
        }`}
      >
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); setConfirmDelete(null); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length === 1) select(filtered[0]);
              else if (canCreate) createAndSelect();
            }
            if (e.key === "Escape") {
              if (confirmDelete) { setConfirmDelete(null); return; }
              setOpen(false); setSearch(selected?.name ?? "");
            }
          }}
          placeholder="Type or search category…"
          className="flex-1 bg-transparent text-[13px] text-fg-0 placeholder:text-fg-3 outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => { setOpen((o) => !o); inputRef.current?.focus(); setConfirmDelete(null); }}
          className="text-fg-3 hover:text-fg-1 transition-colors ml-1"
        >
          <Icon
            name="arrowRight"
            size={12}
            className={`transition-transform duration-150 ${open ? "rotate-90" : "rotate-90 opacity-60"}`}
          />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-bg-1 border border-line rounded-xl shadow-lg overflow-hidden max-h-[220px] flex flex-col">

          {/* Confirm delete prompt */}
          {confirmDelete ? (
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <Icon name="close" size={14} className="text-red-500" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-fg-0">Delete category?</p>
                  <p className="text-[11px] text-fg-2 mt-0.5">
                    &ldquo;<span className="font-medium capitalize">{confirmDelete.name}</span>&rdquo; will be permanently removed. Templates using it will become uncategorized.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 h-8 rounded-lg border border-line text-[12px] text-fg-1 hover:bg-bg-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAndDelete}
                  className="flex-1 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-y-auto flex-1">
                {filtered.length === 0 && !canCreate && (
                  <p className="text-[12px] text-fg-3 px-3 py-3 text-center">No categories found</p>
                )}
                {filtered.map((cat) => (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-1 group/item transition-colors ${
                      cat.id === value ? "bg-accent-soft" : "hover:bg-bg-2"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => select(cat)}
                      className={`flex-1 text-left px-3 py-[9px] text-[13px] flex items-center gap-2 min-w-0 ${
                        cat.id === value ? "text-accent font-medium" : "text-fg-0"
                      }`}
                    >
                      {cat.id === value && <Icon name="arrowRight" size={11} className="text-accent shrink-0" />}
                      <span className="capitalize truncate">{cat.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(cat); }}
                      disabled={deletingId === cat.id}
                      title={`Delete "${cat.name}"`}
                      className="mr-2 w-5 h-5 flex items-center justify-center rounded text-fg-3 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover/item:opacity-100 transition-all shrink-0 disabled:opacity-40"
                    >
                      <Icon name="close" size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {canCreate && (
                <button
                  type="button"
                  onClick={createAndSelect}
                  className="flex items-center gap-2 px-3 py-[9px] text-[13px] text-accent font-medium border-t border-line hover:bg-accent-soft transition-colors shrink-0"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-accent flex items-center justify-center shrink-0">
                    <Icon name="plus" size={10} />
                  </div>
                  Create &ldquo;<span className="font-semibold">{search.trim()}</span>&rdquo;
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
