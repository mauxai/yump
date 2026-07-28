"use client";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { saveSettings } from "./actions";
import { useT } from "@/lib/i18n";

type Driver = "local" | "s3";

type Initial = {
  driver: Driver;
  s3Bucket: string;
  s3Region: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3Endpoint: string;
  s3PublicUrl: string;
};

export function StorageForm({ initial }: { initial: Initial }) {
  const { t } = useT();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver>(initial.driver);
  const [s3Bucket, setS3Bucket] = useState(initial.s3Bucket);
  const [s3Region, setS3Region] = useState(initial.s3Region);
  const [s3AccessKey, setS3AccessKey] = useState(initial.s3AccessKey);
  const [s3SecretKey, setS3SecretKey] = useState(initial.s3SecretKey);
  const [s3Endpoint, setS3Endpoint] = useState(initial.s3Endpoint);
  const [s3PublicUrl, setS3PublicUrl] = useState(initial.s3PublicUrl);
  const [showSecret, setShowSecret] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty =
    driver !== initial.driver ||
    s3Bucket !== initial.s3Bucket ||
    s3Region !== initial.s3Region ||
    s3AccessKey !== initial.s3AccessKey ||
    s3SecretKey !== initial.s3SecretKey ||
    s3Endpoint !== initial.s3Endpoint ||
    s3PublicUrl !== initial.s3PublicUrl;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (driver === "s3" && (!s3Bucket || !s3AccessKey || !s3SecretKey)) {
      setMsg({
        tone: "err",
        text: t("adminSettings.s3RequiredError"),
      });
      return;
    }
    startTransition(async () => {
      const res = await saveSettings("storage", [
        { key: "storage.driver", value: driver },
        { key: "storage.s3Bucket", value: s3Bucket },
        { key: "storage.s3Region", value: s3Region },
        { key: "storage.s3AccessKey", value: s3AccessKey },
        { key: "storage.s3SecretKey", value: s3SecretKey },
        { key: "storage.s3Endpoint", value: s3Endpoint },
        { key: "storage.s3PublicUrl", value: s3PublicUrl },
      ]);
      if (res.ok) {
        setMsg({ tone: "ok", text: t("adminSettings.storageSaved") });
        router.refresh();
      } else {
        setMsg({ tone: "err", text: res.error });
      }
    });
  }

  function onReset() {
    setDriver(initial.driver);
    setS3Bucket(initial.s3Bucket);
    setS3Region(initial.s3Region);
    setS3AccessKey(initial.s3AccessKey);
    setS3SecretKey(initial.s3SecretKey);
    setS3Endpoint(initial.s3Endpoint);
    setS3PublicUrl(initial.s3PublicUrl);
    setMsg(null);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
        <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-line">
          <div className="text-[14px] font-semibold text-fg-0">{t("adminSettings.sectionStorageDriver")}</div>
          <div className="text-[12px] text-fg-2 mt-0.5">
            {t("adminSettings.storageDriverDesc")}
          </div>
        </div>
        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DriverCard
              active={driver === "local"}
              title={t("adminSettings.driverLocal")}
              subtitle={t("adminSettings.driverLocalSubtitle")}
              icon="folder"
              onClick={() => setDriver("local")}
            />
            <DriverCard
              active={driver === "s3"}
              title={t("adminSettings.driverS3")}
              subtitle={t("adminSettings.driverS3Subtitle")}
              icon="upload"
              onClick={() => setDriver("s3")}
            />
          </div>
        </div>
      </section>

      {driver === "local" && (
        <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
          <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-line">
            <div className="text-[14px] font-semibold text-fg-0">{t("adminSettings.sectionLocalConfig")}</div>
            <div className="text-[12px] text-fg-2 mt-0.5">
              Files are stored under the project&apos;s <code className="mono text-fg-1">public/</code> directory.
            </div>
          </div>
          <div className="p-4 sm:p-8">
            <Label>{t("adminSettings.labelUploadPath")}</Label>
            <div className="flex items-center gap-3 h-10 px-3 rounded-lg border border-line-2 bg-bg-2 text-fg-2 text-[13px] mono">
              <Icon name="folder" size={14} className="text-fg-3 shrink-0" />
              /storage
              <span className="ml-auto flex items-center gap-1 text-[11px] text-fg-3">
                <Icon name="lock" size={11} />
                {t("adminSettings.fixed")}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-fg-3 mono">
              Files will be served from <span className="text-fg-1">/storage</span>. This path is fixed and cannot be changed.
            </div>
          </div>
        </section>
      )}

      {driver === "s3" && (
        <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
          <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-line flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[14px] font-semibold text-fg-0">{t("adminSettings.sectionS3Config")}</div>
              <div className="text-[12px] text-fg-2 mt-0.5">
                {t("adminSettings.s3ConfigDesc")}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded border border-line-2 bg-bg-2 text-[10px] mono text-fg-2 shrink-0">
              <Icon name="lock" size={10} />
              {t("adminSettings.keysEncrypted")}
            </span>
          </div>
          <div className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <Label>{t("adminSettings.labelBucket")}</Label>
              <Input
                value={s3Bucket}
                onChange={(e) => setS3Bucket(e.target.value)}
                placeholder="my-app-assets"
              />
            </div>
            <div>
              <Label>{t("adminSettings.labelRegion")}</Label>
              <Input
                value={s3Region}
                onChange={(e) => setS3Region(e.target.value)}
                placeholder="us-east-1"
              />
            </div>
            <div>
              <Label>{t("adminSettings.labelAccessKey")}</Label>
              <Input
                value={s3AccessKey}
                onChange={(e) => setS3AccessKey(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div>
              <Label>
                {t("adminSettings.labelSecretKey")}
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="ml-auto text-[11px] text-fg-2 hover:text-fg-0"
                >
                  {showSecret ? t("adminSettings.hideKey") : t("adminSettings.showKey")}
                </button>
              </Label>
              <Input
                type={showSecret ? "text" : "password"}
                value={s3SecretKey}
                onChange={(e) => setS3SecretKey(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="md:col-span-2">
              <Label>{t("adminSettings.labelEndpoint")}</Label>
              <Input
                value={s3Endpoint}
                onChange={(e) => setS3Endpoint(e.target.value)}
                placeholder="https://<account>.r2.cloudflarestorage.com"
              />
              <div className="mt-2 text-[11px] text-fg-3">
                Leave blank for AWS S3. Set for R2, MinIO, or other S3-compatible providers.
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>{t("adminSettings.labelPublicUrl")}</Label>
              <Input
                value={s3PublicUrl}
                onChange={(e) => setS3PublicUrl(e.target.value)}
                placeholder="https://cdn.example.com"
              />
              <div className="mt-2 text-[11px] text-fg-3">
                Custom domain or CDN that serves the bucket. Files will be referenced as <span className="mono text-fg-2">{(s3PublicUrl || "<url>") + "/<key>"}</span>.
              </div>
            </div>
          </div>
        </section>
      )}

      <ActionBar
        msg={msg}
        dirty={dirty}
        pending={pending}
        onReset={onReset}
      />
    </form>
  );
}

function DriverCard({
  active,
  title,
  subtitle,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  icon: "folder" | "upload";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left flex items-start gap-3 rounded-[10px] border p-4 transition-colors ${
        active
          ? "border-accent bg-accent/5"
          : "border-line-2 bg-bg-2 hover:border-accent/60"
      }`}
    >
      <div
        className={`shrink-0 w-8 h-8 rounded-[8px] flex items-center justify-center ${
          active ? "bg-accent/15 text-accent" : "bg-bg-3 text-fg-2"
        }`}
      >
        <Icon name={icon} size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[13px] font-semibold text-fg-0">{title}</div>
          {active && (
            <span className="text-[10px] text-accent mono uppercase tracking-wide">
              Active
            </span>
          )}
        </div>
        <div className="text-[12px] text-fg-2 mt-0.5">{subtitle}</div>
      </div>
      <div
        className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border ${
          active ? "border-accent bg-accent" : "border-line-2"
        } flex items-center justify-center`}
      >
        {active && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-fg)]" />}
      </div>
    </button>
  );
}

function ActionBar({
  msg,
  dirty,
  pending,
  onReset,
}: {
  msg: { tone: "ok" | "err"; text: string } | null;
  dirty: boolean;
  pending: boolean;
  onReset: () => void;
}) {
  const { t } = useT();
  return (
    <div className="mt-6 sm:mt-8 flex items-center justify-between gap-4 sticky bottom-0 bg-bg-0/90 backdrop-blur-sm border-t border-line py-4 sm:py-5 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10">
      <div className="text-[12px] min-w-0 truncate">
        {msg ? (
          <span className={msg.tone === "ok" ? "text-accent" : "text-[var(--danger)]"}>
            {msg.text}
          </span>
        ) : dirty ? (
          <span className="text-fg-2">{t("adminSettings.saveToApply")}</span>
        ) : (
          <span className="text-fg-3">{t("adminSettings.allChangesSaved")}</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {dirty && (
          <button
            type="button"
            onClick={onReset}
            disabled={pending}
            className="h-9 px-3 rounded-[6px] bg-transparent border border-line-2 text-fg-1 text-[13px] font-medium hover:bg-bg-2 transition-colors"
          >
            {t("adminSettings.reset")}
          </button>
        )}
        <Button variant="primary" size="md" type="submit" disabled={pending || !dirty}>
          {pending ? t("adminSettings.saving") : t("adminSettings.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
