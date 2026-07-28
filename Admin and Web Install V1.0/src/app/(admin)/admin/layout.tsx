import type { ReactNode } from "react";
import { headers } from "next/headers";
import { AdminShellLayout } from "@/components/AdminShellLayout";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = headers().get("x-pathname") ?? "";
  if (pathname === "/admin/login") return <>{children}</>;
  return <AdminShellLayout>{children}</AdminShellLayout>;
}
