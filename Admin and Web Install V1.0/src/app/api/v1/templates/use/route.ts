import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { id } = await req.json();
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.template.update({
    where: { id },
    data: { usageCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
