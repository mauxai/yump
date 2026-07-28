import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettingsByCategory } from "@/lib/settings";
import { SettingsTabs } from "./SettingsTabs";
import { GeneralForm } from "./GeneralForm";
import { StorageForm } from "./StorageForm";
import { SettingsPageHeading } from "./SettingsPageHeading";

export const dynamic = "force-dynamic";

const VALID_TABS = ["general", "storage"] as const;
type Tab = (typeof VALID_TABS)[number];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const raw = searchParams.tab ?? "general";
  const tab: Tab = (VALID_TABS as readonly string[]).includes(raw)
    ? (raw as Tab)
    : "general";

  const [generalRows, storageRows] = await Promise.all([
    getSettingsByCategory("general"),
    getSettingsByCategory("storage"),
  ]);
  const general = Object.fromEntries(generalRows.map((r) => [r.key, r.value]));
  const storage = Object.fromEntries(storageRows.map((r) => [r.key, r.value]));

  return (
    <div className="max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-10">
        <SettingsPageHeading />

        <SettingsTabs active={tab} />

        <div className="mt-6">
          {tab === "general" && (
            <GeneralForm
              initial={{
                country: general["general.country"] ?? "US",
                timezone: general["general.timezone"] ?? "UTC",
                currency: general["general.currency"] ?? "USD",
              }}
            />
          )}
          {tab === "storage" && (
            <StorageForm
              initial={{
                driver: (storage["storage.driver"] === "s3" ? "s3" : "local") as
                  | "local"
                  | "s3",
                s3Bucket: storage["storage.s3Bucket"] ?? "",
                s3Region: storage["storage.s3Region"] ?? "us-east-1",
                s3AccessKey: storage["storage.s3AccessKey"] ?? "",
                s3SecretKey: storage["storage.s3SecretKey"] ?? "",
                s3Endpoint: storage["storage.s3Endpoint"] ?? "",
                s3PublicUrl: storage["storage.s3PublicUrl"] ?? "",
              }}
            />
          )}
        </div>
    </div>
  );
}
