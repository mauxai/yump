"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Camera, Trash2 } from "lucide-react";
import {
  updateAdminProfile,
  updateAdminEmail,
  updateAdminPassword,
  updateAdminAvatar,
  type ActionResult,
} from "./actions";
import { buildAvatarUrl } from "@/lib/storage-url";
import { useT } from "@/lib/i18n";

type Admin = {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: string;
  createdAt: Date;
};

export function AdminProfileForm({ admin }: { admin: Admin }) {
  const { t } = useT();
  const router = useRouter();
  const [savedUrl, setSavedUrl] = useState(buildAvatarUrl(admin.avatar));

  function handleAvatarSaved(url: string | null) {
    setSavedUrl(url);
    router.refresh();
  }

  const initial = (admin.name ?? admin.email).trim().charAt(0).toUpperCase();

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[1fr_240px] gap-6 lg:gap-8 items-start">
      {/* Profile card — top on mobile, sticky sidebar on desktop */}
      <div className="lg:order-2 lg:sticky lg:top-8 space-y-4 w-full">
        <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <div className="text-[13px] font-semibold text-fg-0">{t("adminProfile.sectionProfilePicture")}</div>
            <div className="text-[11px] text-fg-2 mt-0.5">{t("adminProfile.pictureHint")}</div>
          </div>
          {/* Mobile: row layout with avatar left, actions right. Desktop: stacked centred */}
          <div className="px-5 py-5 flex lg:flex-col items-center gap-5 lg:gap-4">
            <AvatarUpload
              savedUrl={savedUrl}
              initial={initial}
              displayName={admin.name || admin.email.split("@")[0]}
              email={admin.email}
              onSaved={handleAvatarSaved}
            />
          </div>
        </section>

        {/* Account info */}
        <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
          <div className="divide-y divide-line">
            <StatRow label={t("adminProfile.labelRole")} value={admin.role === "superadmin" ? t("adminProfile.roleSuperAdmin") : t("adminProfile.roleAdmin")} accent />
            <StatRow
              label={t("adminProfile.labelMemberSince")}
              value={new Date(admin.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
            />
          </div>
        </section>
      </div>

      {/* Form sections */}
      <div className="lg:order-1 space-y-5 lg:space-y-6 w-full">
        <NameSection admin={admin} onSave={() => router.refresh()} />
        <EmailSection admin={admin} />
        <PasswordSection />
      </div>
    </div>
  );
}

/* ─── Avatar upload ─────────────────────────────────── */
function AvatarUpload({
  savedUrl,
  initial,
  displayName,
  email: _email,
  onSaved,
}: {
  savedUrl: string | null;
  initial: string;
  displayName: string;
  email: string;
  onSaved: (url: string | null) => void;
}) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ActionResult | null>(null);

  const displayUrl = previewUrl ?? savedUrl;
  const dirty = stagedFile !== null;

  function handleFile(file: File | undefined) {
    if (!file) return;
    setMsg(null);
    if (!file.type.startsWith("image/")) { setMsg({ ok: false, error: "File must be an image." }); return; }
    if (file.size > 1_000_000) { setMsg({ ok: false, error: "Image must be under 1 MB." }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setStagedFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSave() {
    if (!stagedFile) return;
    start(async () => {
      const fd = new FormData();
      fd.append("avatar", stagedFile);
      const result = await updateAdminAvatar(fd);
      setMsg(result);
      if (result.ok) {
        onSaved(result.avatar ?? null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setStagedFile(null);
      }
    });
  }

  function handleDiscard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStagedFile(null);
    setMsg(null);
  }

  function handleRemove() {
    start(async () => {
      const fd = new FormData();
      const result = await updateAdminAvatar(fd);
      setMsg(result);
      if (result.ok) {
        onSaved(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setStagedFile(null);
      }
    });
  }

  return (
    <div className="w-full flex flex-row lg:flex-col items-center gap-4 lg:gap-3">
      {/* Avatar */}
      <div className="relative w-20 h-20 rounded-full bg-bg-3 border-2 border-line overflow-hidden flex items-center justify-center text-[28px] font-semibold text-fg-0 shrink-0">
        {displayUrl
          ? <img src={displayUrl} alt={displayName} className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
          : initial}
        {dirty && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-[9px] text-white font-semibold tracking-wide uppercase">{t("adminProfile.preview")}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-1 lg:w-full space-y-2">
        <div className="flex gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={pending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-[6px] border border-line-2 bg-bg-2 text-[13px] text-fg-0 hover:bg-bg-3 transition-colors disabled:opacity-50">
            <Camera size={13} />
            {dirty ? t("adminProfile.change") : t("adminProfile.uploadPhoto")}
          </button>
          {(savedUrl || dirty) && !pending && (
            <button type="button" onClick={dirty ? handleDiscard : handleRemove} disabled={pending}
              className="h-9 w-9 inline-flex items-center justify-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-2 hover:text-[var(--danger)] hover:bg-bg-3 transition-colors"
              title={dirty ? "Discard preview" : "Remove photo"}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
        {dirty && (
          <button type="button" onClick={handleSave} disabled={pending}
            className="w-full h-9 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {pending ? t("adminProfile.saving") : t("adminProfile.savePhoto")}
          </button>
        )}
        {msg?.ok === true && (
          <div className="flex items-center gap-1.5 text-[11px] text-accent"><CheckCircle2 size={12} />{msg.message}</div>
        )}
        {msg?.ok === false && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--danger)]"><AlertCircle size={12} />{msg.error}</div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  );
}

/* ─── Name ──────────────────────────────────────────── */
function NameSection({ admin, onSave }: { admin: Admin; onSave: () => void }) {
  const { t } = useT();
  const [name, setName] = useState(admin.name ?? "");
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const dirty = name !== (admin.name ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", name);
    start(async () => { const res = await updateAdminProfile(fd); setMsg(res); if (res.ok) onSave(); });
  }

  return (
    <Card title={t("adminProfile.sectionProfile")} description={t("adminProfile.profileDesc")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[12px] font-medium text-fg-1 mb-1.5">{t("adminProfile.labelFullName")}</label>
          <input type="text" value={name}
            onChange={(e) => { setName(e.target.value); setMsg(null); }}
            placeholder="Your name" maxLength={80}
            className="w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] px-3 outline-none focus:border-accent-line" />
        </div>
        <FormFooter msg={msg} dirty={dirty} pending={pending} />
      </form>
    </Card>
  );
}

/* ─── Email ─────────────────────────────────────────── */
function EmailSection({ admin }: { admin: Admin }) {
  const { t } = useT();
  const [email, setEmail] = useState(admin.email);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const dirty = email !== admin.email || password.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("email", email);
    fd.set("password", password);
    start(async () => { const res = await updateAdminEmail(fd); setMsg(res); if (res.ok) setPassword(""); });
  }

  return (
    <Card title={t("adminProfile.sectionEmail")} description={t("adminProfile.emailDesc")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[12px] font-medium text-fg-1 mb-1.5">{t("adminProfile.labelEmail")}</label>
          <input type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setMsg(null); }}
            className="w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] px-3 outline-none focus:border-accent-line" />
        </div>
        {email !== admin.email && (
          <div>
            <label className="block text-[12px] font-medium text-fg-1 mb-1.5">{t("adminProfile.labelCurrentPassword")}</label>
            <input type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("adminProfile.placeholderConfirmPassword")} autoComplete="current-password"
              className="w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] px-3 outline-none focus:border-accent-line" />
          </div>
        )}
        <FormFooter msg={msg} dirty={dirty} pending={pending} />
      </form>
    </Card>
  );
}

/* ─── Password ──────────────────────────────────────── */
function PasswordSection() {
  const { t } = useT();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const dirty = current.length > 0 || next.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("current", current); fd.set("next", next); fd.set("confirm", confirm);
    start(async () => {
      const res = await updateAdminPassword(fd);
      setMsg(res);
      if (res.ok) { setCurrent(""); setNext(""); setConfirm(""); }
    });
  }

  return (
    <Card title={t("adminProfile.sectionPassword")} description={t("adminProfile.passwordDesc")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[12px] font-medium text-fg-1 mb-1.5">{t("adminProfile.labelCurrentPassword")}</label>
          <input type="password" value={current}
            onChange={(e) => { setCurrent(e.target.value); setMsg(null); }}
            autoComplete="current-password"
            className="w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] px-3 outline-none focus:border-accent-line" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center text-[12px] font-medium text-fg-1 mb-1.5">
              {t("adminProfile.labelNewPassword")}
              <button type="button" onClick={() => setShowNew((v) => !v)} className="ml-auto text-fg-2 hover:text-fg-0">
                {showNew ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </label>
            <input type={showNew ? "text" : "password"} value={next}
              onChange={(e) => { setNext(e.target.value); setMsg(null); }}
              autoComplete="new-password"
              className="w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] px-3 outline-none focus:border-accent-line" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-fg-1 mb-1.5">{t("adminProfile.labelConfirmNew")}</label>
            <input type="password" value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setMsg(null); }}
              autoComplete="new-password"
              className="w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] px-3 outline-none focus:border-accent-line" />
          </div>
        </div>
        {next.length > 0 && confirm.length > 0 && next !== confirm && (
          <div className="text-[12px] text-[var(--danger)]">{t("adminProfile.passwordMismatch")}</div>
        )}
        <FormFooter msg={msg} dirty={dirty} pending={pending} label={t("adminProfile.labelChangePassword")} />
      </form>
    </Card>
  );
}

/* ─── Shared ─────────────────────────────────────────── */
function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-line">
        <div className="text-[15px] font-semibold text-fg-0">{title}</div>
        <div className="text-[12px] text-fg-2 mt-0.5">{description}</div>
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-5">{children}</div>
    </section>
  );
}

function FormFooter({ msg, dirty, pending, label }: { msg: ActionResult | null; dirty: boolean; pending: boolean; label?: string }) {
  const { t } = useT();
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 pt-1">
      <div className="text-[12px] min-w-0">
        {msg?.ok === true && <span className="flex items-center gap-1.5 text-accent"><CheckCircle2 size={13} />{msg.message}</span>}
        {msg?.ok === false && <span className="flex items-center gap-1.5 text-[var(--danger)]"><AlertCircle size={13} />{msg.error}</span>}
      </div>
      <button type="submit" disabled={pending || !dirty}
        className="w-full sm:w-auto h-9 sm:h-8 px-4 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[13px] sm:text-[12px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
        {pending ? t("adminProfile.saving") : (label ?? t("adminProfile.saveChanges"))}
      </button>
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between">
      <span className="text-[12px] text-fg-2">{label}</span>
      <span className={`text-[12px] font-medium ${accent ? "text-accent" : "text-fg-0"}`}>{value}</span>
    </div>
  );
}
