import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clearSessionAndRedirect } from "@/lib/clear-session";
import { AdminProfileForm } from "./AdminProfileForm";
import { ProfilePageHeading } from "./ProfilePageHeading";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; kind?: string } | undefined;
  if (!sessionUser?.id || sessionUser.kind !== "admin") redirect("/admin/login");

  const admin = await prisma.admin.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      createdAt: true,
    },
  });
  if (!admin) clearSessionAndRedirect("/admin/login");

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[900px] mx-auto">
      <ProfilePageHeading />
      <AdminProfileForm admin={admin} />
    </div>
  );
}
