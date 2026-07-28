import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { NewModelContent } from "./NewModelContent";

export default async function NewModelPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return <NewModelContent />;
}
