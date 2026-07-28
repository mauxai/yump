import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clearSessionAndRedirect } from "@/lib/clear-session";
import { ShellLayout } from "@/components/ShellLayout";
import { ProfileForm } from "../ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:          true,
      name:        true,
      email:       true,
      avatar:   true,
      creditsUsed: true,
      creditsTotal:true,
      status:      true,
      createdAt:   true,
    },
  });
  if (!user) clearSessionAndRedirect("/login");

  return (
    <ShellLayout title="Profile" titleKey="settings.profile" subtitle="Manage your personal information and password." subtitleKey="settings.profileSubtitle">
      <ProfileForm user={user} />
    </ShellLayout>
  );
}
