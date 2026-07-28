"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";

export function UserActions({
  user,
  adminId,
}: {
  user: {
    id: string;
    email: string;
    status: string;
    creditsUsed: number;
    creditsTotal: number;
  };
  adminId: string;
}) {
  const router = useRouter();
  const isSelf = user.id === adminId;
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [addDelta, setAddDelta] = useState("10");
  const [setTotal, setSetTotal] = useState(String(user.creditsTotal));
  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function call(op: string, body: unknown, path: string, method = "POST") {
    setBusy(op);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "DELETE" ? undefined : JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.note) setInfo(data.note);
      return data;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      throw e;
    } finally {
      setBusy(null);
    }
  }

  async function addCredits() {
    const delta = parseInt(addDelta, 10);
    if (!Number.isFinite(delta)) return;
    await call(
      "credits-add",
      { op: "add", delta },
      `/api/admin/users/${user.id}/credits`,
    );
    router.refresh();
  }
  async function setCreditsTotal() {
    const n = parseInt(setTotal, 10);
    if (!Number.isFinite(n)) return;
    await call(
      "credits-set",
      { op: "set", creditsTotal: n },
      `/api/admin/users/${user.id}/credits`,
    );
    router.refresh();
  }
  async function resetUsed() {
    if (!confirm("Reset creditsUsed to 0?")) return;
    await call(
      "credits-reset",
      { op: "reset" },
      `/api/admin/users/${user.id}/credits`,
    );
    router.refresh();
  }
  async function toggleStatus() {
    const next = user.status === "active" ? "suspended" : "active";
    if (
      next === "suspended" &&
      !confirm(`Suspend ${user.email}? They won't be able to sign in.`)
    )
      return;
    await call(
      "status",
      { status: next },
      `/api/admin/users/${user.id}/status`,
    );
    router.refresh();
  }
  async function deleteUser() {
    if (deleteConfirm !== user.email) return;
    await call("delete", null, `/api/admin/users/${user.id}`, "DELETE");
    router.push("/admin/users");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {err && (
        <div className="p-3 rounded-md bg-[color:oklch(0.68_0.18_25_/_0.1)] border border-[color:oklch(0.68_0.18_25_/_0.35)] text-[12px] text-[var(--danger)]">
          {err}
        </div>
      )}
      {info && (
        <div className="p-3 rounded-md bg-accent-soft border border-accent-line text-[12px] text-fg-1">
          {info}
        </div>
      )}

      <Panel title="Credits">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <div className="text-[11px] text-fg-2 mb-1 mono">ADD</div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={addDelta}
                onChange={(e) => setAddDelta(e.target.value)}
                className="!w-24"
              />
              <Button
                size="md"
                onClick={addCredits}
                disabled={busy === "credits-add"}
              >
                {busy === "credits-add" ? "…" : "Add"}
              </Button>
            </div>
          </div>
          <div className="flex-1 min-w-[180px]">
            <div className="text-[11px] text-fg-2 mb-1 mono">SET TOTAL</div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={setTotal}
                onChange={(e) => setSetTotal(e.target.value)}
                className="!w-24"
              />
              <Button
                size="md"
                onClick={setCreditsTotal}
                disabled={busy === "credits-set"}
              >
                {busy === "credits-set" ? "…" : "Set"}
              </Button>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-fg-2 mb-1 mono">RESET USED</div>
            <Button
              variant="ghost"
              onClick={resetUsed}
              disabled={busy === "credits-reset"}
            >
              {busy === "credits-reset" ? "…" : "Reset to 0"}
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Access">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={toggleStatus}
            disabled={isSelf || busy === "status"}
            title={isSelf ? "Cannot change your own status" : undefined}
            variant={user.status === "active" ? "default" : "primary"}
          >
            {user.status === "active" ? (
              <>
                <Icon name="lock" size={13} /> Suspend
              </>
            ) : (
              <>
                <Icon name="bolt" size={13} /> Unsuspend
              </>
            )}
          </Button>
          <Badge tone={user.status === "active" ? "muted" : "default"}>
            Status: {user.status}
          </Badge>
        </div>
      </Panel>

      <Panel title="Danger zone" tone="danger">
        <div className="text-[12px] text-fg-2 mb-3">
          Deleting a user permanently removes their projects and every edit. This
          cannot be undone.
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <div className="text-[11px] text-fg-2 mb-1 mono">
              Type <span className="text-fg-0">{user.email}</span> to confirm
            </div>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={user.email}
            />
          </div>
          <button
            onClick={deleteUser}
            disabled={isSelf || deleteConfirm !== user.email || busy === "delete"}
            className="h-9 px-4 rounded-[6px] bg-[var(--danger)] text-[#0A0B0D] font-semibold text-[13px] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
          >
            {busy === "delete" ? "Deleting…" : "Delete user"}
          </button>
        </div>
      </Panel>
    </div>
  );
}

function Panel({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border p-5"
      style={{
        background: "var(--bg-1)",
        borderColor:
          tone === "danger" ? "oklch(0.68 0.18 25 / 0.35)" : "var(--line)",
      }}
    >
      <div
        className="text-[11px] uppercase tracking-[0.6px] mb-3 mono"
        style={{
          color: tone === "danger" ? "var(--danger)" : "var(--fg-2)",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
