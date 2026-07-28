import type { PrismaClient } from "@prisma/client";

export async function wipeAll(prisma: PrismaClient) {
  await prisma.edit.deleteMany();
  await prisma.project.deleteMany();
  await prisma.adminAudit.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.setting.deleteMany();
}
