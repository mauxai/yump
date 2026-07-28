import type { ToastVariant } from "@/components/Toast";

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

function emit(detail: {
  op: "add" | "remove" | "update";
  id: string;
  variant?: ToastVariant;
  title?: string;
  description?: string;
  duration?: number;
}): string {
  if (typeof window === "undefined") return detail.id;
  window.dispatchEvent(new CustomEvent("app:toast", { detail }));
  return detail.id;
}

export const toast = {
  success(title: string, description?: string): string {
    return emit({ op: "add", id: uid(), variant: "success", title, description });
  },

  error(title: string, description?: string): string {
    return emit({ op: "add", id: uid(), variant: "error", title, description });
  },

  warning(title: string, description?: string): string {
    return emit({ op: "add", id: uid(), variant: "warning", title, description });
  },

  info(title: string, description?: string): string {
    return emit({ op: "add", id: uid(), variant: "info", title, description });
  },

  /** Shows a persistent spinner toast. Returns the id for later resolving. */
  loading(title: string, description?: string): string {
    const id = uid();
    emit({ op: "add", id, variant: "loading", title, description, duration: 0 });
    return id;
  },

  /** Dismiss a toast by id. */
  dismiss(id: string): void {
    emit({ op: "remove", id });
  },

  /**
   * Resolve a loading (or any) toast to a final state.
   *   const id = toast.loading("Saving…")
   *   toast.resolve(id, "success", "Saved!")
   */
  resolve(
    id: string,
    variant: "success" | "error" | "warning" | "info",
    title: string,
    description?: string
  ): void {
    emit({ op: "update", id, variant, title, description });
  },

  /**
   * Wraps a promise — shows a loading toast while pending, resolves to
   * success or error when it settles.
   *
   *   await toast.promise(savePlan(fd), {
   *     loading: "Saving plan…",
   *     success: "Plan saved!",
   *     error:   "Failed to save.",
   *   });
   */
  async promise<T>(
    p: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((v: T) => string);
      error: string | ((e: unknown) => string);
      description?: string;
    }
  ): Promise<T> {
    const id = toast.loading(msgs.loading, msgs.description);
    try {
      const v = await p;
      const title = typeof msgs.success === "function" ? msgs.success(v) : msgs.success;
      toast.resolve(id, "success", title);
      return v;
    } catch (e) {
      const title = typeof msgs.error === "function" ? msgs.error(e) : msgs.error;
      toast.resolve(id, "error", title);
      throw e;
    }
  },
};
