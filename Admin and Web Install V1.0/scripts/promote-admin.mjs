#!/usr/bin/env node
// Flip a user's role to "admin". Usage:
//   npm run admin:promote -- alice@example.com
// Optional flags:
//   --demote   Flip role back to "user"

import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"));
const demote = args.includes("--demote");

if (!email) {
  console.error("usage: npm run admin:promote -- <email> [--demote]");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`user not found: ${email}`);
    process.exit(2);
  }

  const nextRole = demote ? "user" : "admin";
  if (user.role === nextRole) {
    console.log(`already ${nextRole}: ${email}`);
    process.exit(0);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: nextRole },
    select: { id: true, email: true, role: true },
  });
  console.log(JSON.stringify(updated, null, 2));
  console.log(
    `\nNote: ${email} must sign out and sign back in for the new role to take effect.`,
  );
} finally {
  await prisma.$disconnect();
}
