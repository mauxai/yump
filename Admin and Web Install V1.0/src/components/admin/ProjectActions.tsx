"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onDelete() {
    if (
      !confirm(
        `Delete project "${projectName}"? This removes every edit and cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.push("/admin/projects");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <div>
      {err && (
        <div className="text-[12px] text-[var(--danger)] mb-2">{err}</div>
      )}
      <button
        onClick={onDelete}
        disabled={busy}
        className="h-9 px-4 rounded-[6px] bg-[var(--danger)] text-[#0A0B0D] font-semibold text-[13px] disabled:opacity-40 hover:brightness-110"
      >
        {busy ? "Deleting…" : "Delete project"}
      </button>
    </div>
  );
}
