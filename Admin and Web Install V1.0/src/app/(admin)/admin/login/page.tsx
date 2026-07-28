import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <AdminLoginForm />
      </Suspense>
    </AuthShell>
  );
}
