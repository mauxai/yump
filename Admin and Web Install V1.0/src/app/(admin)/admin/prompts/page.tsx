import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSetting } from "@/lib/settings";
import { PromptsForm } from "./PromptsForm";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const raw = await getSetting("editor.suggestedPrompts", "[]");
  let prompts: string[] = [];
  try { prompts = JSON.parse(raw); } catch { prompts = []; }

  return <PromptsForm initial={prompts} />;
}
