import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ShellLayout } from "@/components/ShellLayout";
import { NotificationsContent } from "./NotificationsContent";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  const userId  = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const rows = await prisma.$queryRaw<{
    id: string; title: string; body: string;
    data: unknown; is_read: number; created_at: Date;
  }[]>`
    SELECT id, title, body, data, is_read, created_at
    FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  const notifications = rows.map((r) => ({
    id:        r.id,
    title:     r.title,
    body:      r.body,
    // `data` is a JSON column: the driver returns it already parsed (object),
    // though older rows may still hold a stringified payload — handle both.
    data:      typeof r.data === "string" ? JSON.parse(r.data) : (r.data ?? null),
    isRead:    r.is_read === 1,
    createdAt: r.created_at.toISOString(),
  }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <ShellLayout title="Notifications" titleKey="nav.notifications">
      <NotificationsContent initial={notifications} initialUnread={unreadCount} />
    </ShellLayout>
  );
}
