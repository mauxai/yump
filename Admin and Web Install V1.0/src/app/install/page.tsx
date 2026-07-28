import { redirect } from "next/navigation";
import { Syne } from "next/font/google";
import { getInstallState } from "@/features/install/status";
import { InstallWizard } from "./InstallWizard";

export const dynamic = "force-dynamic";

// Display face for the wizard only — the rest of the app keeps Inter.
const displayFont = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-install-display",
});

export const metadata = {
  title: "Installation",
};

export default async function InstallPage() {
  // Middleware already blocks this page post-install; this is the
  // belt-and-braces server-side check (middleware caches can lag one request).
  const state = await getInstallState();
  if (state.installed) redirect("/");

  return (
    <div className={displayFont.variable}>
      <InstallWizard initialStep={state.step} />
    </div>
  );
}
