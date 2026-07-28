"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { updateProfile, updateEmail, updatePassword, updateAvatar, type ActionResult } from "./actions";
import { buildAvatarUrl } from "@/lib/storage-url";
import { FadeImage } from "@/components/FadeImage";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Camera, Trash2, User, Mail, Lock, CreditCard, Shield, Calendar } from "lucide-react";
import { useT } from "@/lib/i18n";

type User = {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  creditsUsed: number;
  creditsTotal: number;
  status: string;
  createdAt: Date;
};

export function ProfileForm({ user }: { user: User }) {
  const { t } = useT();
  const router = useRouter();
  const [savedUrl, setSavedUrl] = useState(buildAvatarUrl(user.avatar));

  function handleAvatarSaved(url: string | null) {
    setSavedUrl(url);
    router.refresh();
  }

  const initial = (user.name ?? user.email).trim().charAt(0).toUpperCase();
  const creditsLeft = user.creditsTotal - user.creditsUsed;
  const creditsPct = user.creditsTotal > 0 ? Math.round((creditsLeft / user.creditsTotal) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
      {/* LEFT: profile identity card + stats */}
      <div className="lg:sticky lg:top-8 space-y-4">
        {/* Identity card */}
        <div className="rounded-2xl border border-line bg-bg-1 overflow-hidden">
          {/* gradient header */}
          <div className="relative h-24 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, var(--accent) 0%, transparent 60%)" }}
            />
          </div>
          {/* avatar — overlapping header */}
          <div className="px-5 pb-5">
            <div className="-mt-10 mb-3 flex justify-between items-end">
              <AvatarUpload
                savedUrl={savedUrl}
                initial={initial}
                displayName={user.name || user.email.split("@")[0]}
                email={user.email}
                onSaved={handleAvatarSaved}
              />
            </div>
            <div className="text-[15px] font-semibold text-fg-0 leading-tight">
              {user.name || user.email.split("@")[0]}
            </div>
            <div className="text-[12px] text-fg-3 mt-0.5">{user.email}</div>

            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                user.status === "active"
                  ? "bg-accent/10 text-accent"
                  : "bg-red-500/10 text-red-500"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-accent" : "bg-red-500"}`} />
                {user.status === "active" ? t("settings.activeStatus") : t("settings.suspendedStatus")}
              </span>
              <span className="text-[11px] text-fg-4">
                {t("settings.joined")} {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Credits card */}
        <div className="rounded-2xl border border-line bg-bg-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
              <CreditCard size={12} className="text-accent" />
            </div>
            <span className="text-[12px] font-semibold text-fg-0">{t("settings.creditsCard")}</span>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[22px] font-bold text-fg-0">{creditsLeft}</span>
              <span className="text-[12px] text-fg-3">{t("settings.ofRemaining", { total: String(user.creditsTotal) })}</span>
            </div>
            {/* progress bar */}
            <div className="h-1.5 rounded-full bg-bg-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${creditsPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-fg-3">
              <span>{t("settings.creditsUsedLabel", { used: String(user.creditsUsed) })}</span>
              <span>{t("settings.pctLeft", { pct: String(creditsPct) })}</span>
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="rounded-2xl border border-line bg-bg-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-bg-3 flex items-center justify-center">
              <Shield size={12} className="text-fg-2" />
            </div>
            <span className="text-[12px] font-semibold text-fg-0">{t("settings.accountCard")}</span>
          </div>
          <div className="divide-y divide-line">
            <SideStatRow icon={<Calendar size={11} />} label={t("settings.memberSince")} value={new Date(user.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })} />
            <SideStatRow icon={<CreditCard size={11} />} label={t("settings.creditsUsedStat")} value={String(user.creditsUsed)} />
          </div>
        </div>
      </div>

      {/* RIGHT: form sections */}
      <div className="space-y-4">
        <NameSection user={user} onSave={() => router.refresh()} />
        <EmailSection user={user} />
        <PasswordSection />
      </div>
    </div>
  );
}

/* ─── Avatar upload ──────────────────────────────────── */
function AvatarUpload({
  savedUrl,
  initial,
  displayName,
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
    if (file.size > 5_000_000) { setMsg({ ok: false, error: "Image must be under 5 MB." }); return; }
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
      const result = await updateAvatar(fd);
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
      const result = await updateAvatar(fd);
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
    <div className="space-y-2">
      {/* Avatar ring */}
      <div className="relative">
        <div className="relative w-[72px] h-[72px] rounded-full ring-4 ring-bg-1 bg-bg-3 border border-line overflow-hidden flex items-center justify-center text-[26px] font-semibold text-fg-0 shadow-md">
          {displayUrl ? (
            <FadeImage
              src={displayUrl}
              // Local upload preview (blob:) and data: URLs are instant — no LQIP.
              // Saved avatars get a blur-up from the server.
              lqipSrc={
                previewUrl || displayUrl.startsWith("data:")
                  ? undefined
                  : "/api/v1/user/avatar/lqip"
              }
              alt={displayName}
              sizes="72px"
            />
          ) : (
            initial
          )}
        </div>
        {/* camera badge */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          title="Upload photo"
        >
          <Camera size={11} className="text-[var(--accent-fg)]" />
        </button>
      </div>

      {/* staged actions */}
      {dirty && (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="flex-1 h-7 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[11px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {pending ? "…" : t("common.save")}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={pending}
            className="h-7 w-7 inline-flex items-center justify-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-2 hover:bg-bg-3 transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
      {!dirty && savedUrl && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={pending}
          className="text-[11px] text-fg-3 hover:text-[var(--danger)] transition-colors"
        >
          {t("settings.remove")}
        </button>
      )}

      {msg?.ok === true && (
        <div className="flex items-center gap-1 text-[10px] text-accent">
          <CheckCircle2 size={10} /> {msg.message}
        </div>
      )}
      {msg?.ok === false && (
        <div className="flex items-center gap-1 text-[10px] text-[var(--danger)]">
          <AlertCircle size={10} /> {msg.error}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

/* ─── Name ─────────────────────────────────────────── */
function NameSection({ user, onSave }: { user: User; onSave: () => void }) {
  const { t } = useT();
  const [name, setName] = useState(user.name ?? "");
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const dirty = name !== (user.name ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", name);
    start(async () => {
      const res = await updateProfile(fd);
      setMsg(res);
      if (res.ok) onSave();
    });
  }

  return (
    <Card icon={<User size={13} />} title={t("settings.profileTitle")} description={t("settings.profileDesc")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>{t("auth.name")}</Label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setMsg(null); }}
            placeholder={t("settings.yourName")}
            maxLength={80}
          />
        </div>
        <FormFooter msg={msg} dirty={dirty} pending={pending} label={t("settings.saveChanges")} />
      </form>
    </Card>
  );
}

/* ─── Email ─────────────────────────────────────────── */
function EmailSection({ user }: { user: User }) {
  const { t } = useT();
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const dirty = email !== user.email || password.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("email", email);
    fd.set("password", password);
    start(async () => {
      const res = await updateEmail(fd);
      setMsg(res);
      if (res.ok) setPassword("");
    });
  }

  return (
    <Card icon={<Mail size={13} />} title={t("settings.emailAddress")} description={t("settings.emailDesc")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>{t("auth.email")}</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setMsg(null); }}
          />
        </div>
        {email !== user.email && (
          <div>
            <Label>{t("settings.currentPassword")}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("settings.confirmWithPassword")}
              autoComplete="current-password"
            />
          </div>
        )}
        <FormFooter msg={msg} dirty={dirty} pending={pending} label={t("settings.saveChanges")} />
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
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const dirty = current.length > 0 || next.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("current", current);
    fd.set("next", next);
    fd.set("confirm", confirm);
    start(async () => {
      const res = await updatePassword(fd);
      setMsg(res);
      if (res.ok) { setCurrent(""); setNext(""); setConfirm(""); }
    });
  }

  return (
    <Card icon={<Lock size={13} />} title={t("auth.password")} description={t("settings.passwordDesc")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>{t("settings.currentPassword")}</Label>
          <PasswordInput
            value={current}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            onChange={(e) => { setCurrent(e.target.value); setMsg(null); }}
            autoComplete="current-password"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>{t("auth.newPassword")}</Label>
            <PasswordInput
              value={next}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              onChange={(e) => { setNext(e.target.value); setMsg(null); }}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>{t("settings.confirmNewPassword")}</Label>
            <PasswordInput
              value={confirm}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              onChange={(e) => { setConfirm(e.target.value); setMsg(null); }}
              autoComplete="new-password"
            />
          </div>
        </div>
        {next.length > 0 && confirm.length > 0 && next !== confirm && (
          <div className="text-[12px] text-[var(--danger)]">{t("auth.passwordsNoMatch")}</div>
        )}
        <FormFooter msg={msg} dirty={dirty} pending={pending} label={t("settings.changePassword")} />
      </form>
    </Card>
  );
}

/* ─── Password input with inline eye toggle ─────────── */
function PasswordInput({
  value,
  show,
  onToggle,
  onChange,
  autoComplete,
}: {
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="pr-9"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 w-9 flex items-center justify-center text-fg-3 hover:text-fg-0 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

/* ─── Shared ─────────────────────────────────────────── */
function Card({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-bg-1 overflow-hidden">
      <div className="px-5 py-4 bg-bg-2 border-b border-line flex items-center gap-3">
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-bg-3 border border-line flex items-center justify-center text-fg-2 flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <div className="text-[13px] font-semibold text-fg-0 leading-tight">{title}</div>
          <div className="text-[11px] text-fg-3 mt-0.5">{description}</div>
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function FormFooter({ msg, dirty, pending, label }: { msg: ActionResult | null; dirty: boolean; pending: boolean; label: string }) {
  const { t } = useT();
  return (
    <div className="flex items-center justify-between gap-4 pt-1">
      <div className="text-[12px] min-w-0">
        {msg?.ok === true && (
          <span className="flex items-center gap-1.5 text-accent"><CheckCircle2 size={13} /> {msg.message}</span>
        )}
        {msg?.ok === false && (
          <span className="flex items-center gap-1.5 text-[var(--danger)]"><AlertCircle size={13} /> {msg.error}</span>
        )}
      </div>
      <Button variant="primary" size="sm" type="submit" disabled={pending || !dirty}>
        {pending ? t("settings.saving") : label}
      </Button>
    </div>
  );
}

function SideStatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="text-fg-3">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-fg-3">{label}</div>
        <div className="text-[12px] font-medium text-fg-0 mt-0.5">{value}</div>
      </div>
    </div>
  );
}
