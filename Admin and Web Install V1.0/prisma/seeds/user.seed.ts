import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedUsers(prisma: PrismaClient) {
  const email = "user@user.com";
  const password = "12345678";
  const name = "Demo User";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 10),
        creditsTotal: 100,
      },
    });
  }

  return { email, password };
}
