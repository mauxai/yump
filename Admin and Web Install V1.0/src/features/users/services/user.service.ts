import { prisma } from "@/lib/prisma";
import type { UserPublic } from "../types";

export async function getUserById(userId: string): Promise<UserPublic | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:          true,
      name:        true,
      email:       true,
      avatar:   true,
      status:      true,
      creditsUsed: true,
      creditsTotal:true,
      createdAt:   true,
    },
  });
  if (!user) return null;
  return {
    ...user,
    status:    user.status as "active" | "suspended",
    createdAt: user.createdAt.toISOString(),
  };
}

export async function checkCredits(userId: string, cost: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsUsed: true, creditsTotal: true },
  });
  if (!user) return false;
  return user.creditsTotal - user.creditsUsed >= cost;
}

export async function deductCredits(userId: string, amount: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data:  { creditsUsed: { increment: amount } },
  });
}
