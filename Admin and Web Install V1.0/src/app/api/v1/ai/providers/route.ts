import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/utils/error-handler";

export const dynamic = "force-dynamic";

/**
 * @openapi
 * /api/ai/providers:
 *   get:
 *     summary: Get all available AI providers and models
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: List of active AI models
 */
export async function GET() {
  try {
    const models = await prisma.aiModel.findMany({
      where: { isActive: true },
      orderBy: { label: "asc" },
      select: {
        id:         true,
        label:      true,
        provider:   true,
        modelId:    true,
        creditCost: true,
      },
    });

    return NextResponse.json({ providers: models });
  } catch (err) {
    return handleApiError(err);
  }
}
