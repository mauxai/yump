import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ShellLayout } from "@/components/ShellLayout";

export const dynamic = "force-dynamic";

export default async function SettingsBillingPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  // Delegate to the main billing page
  redirect("/billing");
}
