import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedAdmins(prisma: PrismaClient) {
  const email = "admin@admin.com";
  const password = "12345678";

  await prisma.admin.create({
    data: {
      email,
      name: "Super Admin",
      passwordHash: await bcrypt.hash(password, 10),
      role: "superadmin",
    },
  });

  return { email, password };
}
