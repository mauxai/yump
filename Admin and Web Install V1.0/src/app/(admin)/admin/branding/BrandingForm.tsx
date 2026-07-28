"use client";
import {
  useRef,
  useState,
  useTransition,
  type DragEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { saveSettings } from "./actions";
import { toast } from "@/lib/toast";
import { useT } from "@/lib/i18n";

type InitialBranding = {
  name: string;
  slogan: string;
  logo: string;
  favicon: string;
  primaryDark: string;
  primaryLight: string;
  sketchColor: string;
};

export function BrandingForm({ initial }: { initial: InitialBranding }) {
  const { t } = useT();
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [slogan, setSlogan] = useState(initial.slogan);
  const [logo, setLogo] = useState(initial.logo);
  const [favicon, setFavicon] = useState(initial.favicon);
  const [primaryDark, setPrimaryDark] = useState(initial.primaryDark);
  const [primaryLight, setPrimaryLight] = useState(initial.primaryLight);
  const [sketchColor, setSketchColor] = useState(initial.sketchColor);
  const [pending, startTransition] = useTransition();

  const dirty =
    name !== initial.name ||
    slogan !== initial.slogan ||
    logo !== initial.logo ||
    favicon !== initial.favicon ||
    primaryDark !== initial.primaryDark ||
    primaryLight !== initial.primaryLight ||
    sketchColor !== initial.sketchColor;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const id = toast.loading(t("adminBranding.toastSaving"));
      const res = await saveSettings("branding", [
        { key: "brand.name", value: name },
        { key: "brand.slogan", value: slogan },
        { key: "brand.logo", value: logo },
        { key: "brand.favicon", value: favicon },
        { key: "brand.primaryDark", value: primaryDark },
        { key: "brand.primaryLight", value: primaryLight },
        { key: "editor.sketchColor", value: sketchColor },
      ]);
      if (res.ok) {
        toast.resolve(id, "success", t("adminBranding.toastSaved"));
        router.refresh();
      } else {
        toast.resolve(id, "error", res.error);
      }
    });
  }

  function onReset() {
    setName(initial.name);
    setSlogan(initial.slogan);
    setLogo(initial.logo);
    setFavicon(initial.favicon);
    setPrimaryDark(initial.primaryDark);
    setPrimaryLight(initial.primaryLight);
    setSketchColor(initial.sketchColor);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-10">
      {/* Page heading */}
      <div className="mb-5 sm:mb-8 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">
            {t("adminBranding.breadcrumb")}
          </div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">
            {t("adminBranding.title")}
          </h1>
          <p className="text-[13px] text-fg-2 mt-1 max-w-[560px]">
            {t("adminBranding.subtitle")}
          </p>
        </div>
        {/* Desktop save controls */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {dirty && (
            <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full border border-accent/40 bg-accent/5 text-[11px] text-accent mono">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {t("adminBranding.unsaved")}
            </span>
          )}
          {dirty && (
            <button
              type="button"
              onClick={onReset}
              disabled={pending}
              className="h-9 px-3 rounded-[6px] bg-transparent border border-line-2 text-fg-1 text-[13px] font-medium hover:bg-bg-2 transition-colors"
            >
              {t("adminBranding.reset")}
            </button>
          )}
          <Button variant="primary" size="md" type="submit" disabled={pending || !dirty}>
            {pending ? t("adminBranding.saving") : t("adminBranding.saveChanges")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 sm:gap-8">
        {/* Left: form fields */}
        <div className="space-y-4 sm:space-y-6">
          <Section
            title={t("adminBranding.sectionIdentity")}
            description={t("adminBranding.sectionIdentityDesc")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t("adminBranding.labelSystemName")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="6amStudio"
                  maxLength={80}
                />
              </div>
              <div>
                <Label>{t("adminBranding.labelSlogan")}</Label>
                <Input
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="AI-powered photo editing"
                  maxLength={160}
                />
              </div>
            </div>
          </Section>

          <Section
            title={t("adminBranding.sectionBrandColor")}
            description={t("adminBranding.sectionBrandColorDesc")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColorPicker
                label={t("adminBranding.labelDarkMode")}
                hint={t("adminBranding.hintDarkMode")}
                value={primaryDark}
                onChange={setPrimaryDark}
              />
              <ColorPicker
                label={t("adminBranding.labelLightMode")}
                hint={t("adminBranding.hintLightMode")}
                value={primaryLight}
                onChange={setPrimaryLight}
              />
            </div>
          </Section>

          <Section
            title={t("adminBranding.sectionEditorTools")}
            description={t("adminBranding.sectionEditorToolsDesc")}
          >
            <div className="max-w-xs">
              <ColorPicker
                label={t("adminBranding.labelSketchColor")}
                hint={t("adminBranding.hintSketchColor")}
                value={sketchColor}
                onChange={setSketchColor}
              />
            </div>
          </Section>

          <Section
            title={t("adminBranding.sectionAssets")}
            description={t("adminBranding.sectionAssetsDesc")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UploadCard
                label={t("adminBranding.labelLogo")}
                hint={t("adminBranding.hintLogo")}
                value={logo}
                previewShape="rounded-[10px]"
                onChange={setLogo}
                onError={(msg) => toast.error(msg)}
              />
              <UploadCard
                label={t("adminBranding.labelFavicon")}
                hint={t("adminBranding.hintFavicon")}
                value={favicon}
                previewShape="rounded-[6px]"
                onChange={setFavicon}
                onError={(msg) => toast.error(msg)}
              />
            </div>
          </Section>
        </div>

        {/* Right: live preview — desktop only */}
        <aside className="hidden lg:block space-y-4 lg:sticky lg:top-8 self-start">
          <div className="rounded-xl border border-line bg-bg-1 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <div className="text-[11px] text-fg-2 uppercase tracking-[0.6px] mono">
                {t("adminBranding.livePreview")}
              </div>
              <span className="text-[10px] text-fg-3 mono">{t("adminBranding.sidebar")}</span>
            </div>
            <div className="p-4 bg-bg-0">
              <SidebarPreview name={name} slogan={slogan} logo={logo} primaryColor={primaryDark} />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-bg-1 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <div className="text-[11px] text-fg-2 uppercase tracking-[0.6px] mono">
                {t("adminBranding.browserTab")}
              </div>
              <span className="text-[10px] text-fg-3 mono">{t("adminBranding.faviconTitle")}</span>
            </div>
            <div className="p-4 bg-bg-0">
              <BrowserTabPreview name={name} slogan={slogan} favicon={favicon} />
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="sm:hidden mt-6 flex items-center justify-between gap-4 sticky bottom-0 bg-bg-0/90 backdrop-blur-sm border-t border-line py-4 -mx-4 px-4">
        <div className="text-[12px] min-w-0 truncate">
          {dirty ? (
            <span className="text-fg-2">{t("adminBranding.unsavedChanges")}</span>
          ) : (
            <span className="text-fg-3">{t("adminBranding.allChangesSaved")}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dirty && (
            <button type="button" onClick={onReset} disabled={pending}
              className="h-9 px-3 rounded-[6px] bg-transparent border border-line-2 text-fg-1 text-[13px] font-medium hover:bg-bg-2 transition-colors">
              {t("adminBranding.reset")}
            </button>
          )}
          <Button variant="primary" size="md" type="submit" disabled={pending || !dirty}>
            {pending ? t("adminBranding.saving") : t("adminBranding.saveChanges")}
          </Button>
        </div>
      </div>

    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
      <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-line">
        <div className="text-[14px] sm:text-[15px] font-semibold text-fg-0">{title}</div>
        <div className="text-[12px] text-fg-2 mt-1">{description}</div>
      </div>
      <div className="p-4 sm:p-8">{children}</div>
    </section>
  );
}

function SidebarPreview({
  name,
  slogan,
  logo,
  primaryColor,
}: {
  name: string;
  slogan: string;
  logo: string;
  primaryColor: string;
}) {
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  const fg = (0.299 * parseInt(primaryColor.slice(1,3),16) + 0.587 * parseInt(primaryColor.slice(3,5),16) + 0.114 * parseInt(primaryColor.slice(5,7),16)) / 255 > 0.55 ? "#0a0b0d" : "#ffffff";
  return (
    <div className="rounded-[10px] border border-line-2 bg-bg-1 p-3 w-full">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center font-bold text-[13px] overflow-hidden shrink-0"
          style={{ background: primaryColor, color: fg }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-fg-0 truncate leading-tight">
            {name || "System name"}
          </div>
          {slogan && (
            <div className="text-[10px] text-fg-2 truncate leading-tight mt-0.5">
              {slogan}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full" style={{ background: primaryColor, opacity: 0.25 }} />
      <div className="mt-2 flex gap-1.5">
        <div className="h-6 px-2 rounded-[5px] text-[10px] font-medium flex items-center" style={{ background: primaryColor, color: fg }}>
          Button
        </div>
        <div className="h-6 px-2 rounded-[5px] text-[10px] font-medium flex items-center border" style={{ borderColor: primaryColor, color: primaryColor }}>
          Outline
        </div>
      </div>
    </div>
  );
}

function BrowserTabPreview({
  name,
  slogan,
  favicon,
}: {
  name: string;
  slogan: string;
  favicon: string;
}) {
  const title = `${name || "System name"}${slogan ? ` — ${slogan}` : ""}`;
  return (
    <div className="flex items-center gap-2 h-8 px-3 rounded-t-[8px] bg-bg-2 border border-line-2 border-b-0 max-w-full">
      <div className="w-4 h-4 rounded-[3px] bg-bg-3 border border-line-2 overflow-hidden flex items-center justify-center shrink-0">
        {favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={favicon} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icon name="image" size={9} className="text-fg-3" />
        )}
      </div>
      <span className="text-[11px] text-fg-1 truncate flex-1">{title}</span>
      <Icon name="close" size={10} className="text-fg-3 shrink-0" />
    </div>
  );
}

function UploadCard({
  label,
  hint,
  value,
  previewShape,
  onChange,
  onError,
}: {
  label: string;
  hint: string;
  value: string;
  previewShape: string;
  onChange: (v: string) => void;
  onError: (text: string) => void;
}) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError(t("adminBranding.fileNotImage"));
      return;
    }
    if (file.size > 500_000) {
      onError(t("adminBranding.fileTooLarge", { label }));
      return;
    }
    onChange(await readAsDataUrl(file));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  const hasImage = Boolean(value);

  return (
    <div>
      <Label>{label}</Label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !hasImage && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !hasImage) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`relative flex items-center gap-4 rounded-[10px] border border-dashed p-4 transition-colors ${
          dragging
            ? "border-accent bg-accent/5"
            : hasImage
              ? "border-line-2 bg-bg-2"
              : "border-line-2 bg-bg-2 hover:border-accent/60 hover:bg-accent/5 cursor-pointer"
        }`}
      >
        <div
          className={`shrink-0 w-14 h-14 ${previewShape} bg-bg-3 border border-line-2 overflow-hidden flex items-center justify-center`}
        >
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon name="image" size={18} className="text-fg-3" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-fg-0 truncate">
            {hasImage ? t("adminBranding.uploadedState") : t("adminBranding.dropToUpload")}
          </div>
          <div className="text-[11px] text-fg-2 mt-0.5 truncate">{hint}</div>
        </div>

        {hasImage && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-[6px] border border-line-2 bg-bg-1 text-[12px] text-fg-0 hover:bg-bg-3"
            >
              <Icon name="upload" size={11} /> {t("adminBranding.changeBtn")}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              aria-label={`Remove ${label.toLowerCase()}`}
              className="inline-flex items-center justify-center w-7 h-7 rounded-[6px] text-fg-2 hover:text-[var(--danger)] hover:bg-bg-3"
            >
              <Icon name="trash" size={11} />
            </button>
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
    </div>
  );
}

function ColorPicker({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useT();
  return (
    <div>
      <Label>{label}</Label>
      <div className="text-[11px] text-fg-2 mb-2">{hint}</div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
          <div
            className="w-10 h-10 rounded-[8px] border-2 border-line-2 shadow-sm cursor-pointer"
            style={{ background: value }}
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
            }}
            maxLength={7}
            className="w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none transition-colors focus:border-accent-line px-3 mono"
            placeholder="#a3e635"
          />
        </div>
        <div
          className="shrink-0 h-9 px-3 rounded-[6px] text-[12px] font-semibold flex items-center"
          style={{
            background: value,
            color: (0.299 * parseInt(value.slice(1,3)||"0",16) + 0.587 * parseInt(value.slice(3,5)||"0",16) + 0.114 * parseInt(value.slice(5,7)||"0",16)) / 255 > 0.55 ? "#0a0b0d" : "#ffffff",
          }}
        >
          {t("adminBranding.colorPreview")}
        </div>
      </div>
    </div>
  );
}
