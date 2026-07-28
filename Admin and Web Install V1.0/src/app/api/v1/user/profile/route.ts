import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { unauthorized, handleApiError } from "@/lib/utils/error-handler";
import { buildAvatarUrl } from "@/lib/storage-url";
import { putFile } from "@/lib/storage";

type ValidationErrors = Record<string, string[]>;

function validationError(errors: ValidationErrors) {
  return NextResponse.json(
    { message: "The given data was invalid.", errors },
    { status: 422 },
  );
}

/**
 * @openapi
 * /api/user/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: Request) {
  try {
    const userId = await requireUserId(req);
    if (!userId) return unauthorized();

    const [user, latestBilling, projectCount, editCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id:           true,
          name:         true,
          email:        true,
          avatar:       true,
          status:       true,
          creditsUsed:  true,
          creditsTotal: true,
          createdAt:    true,
          lastActiveAt: true,
        },
      }),
      prisma.billingHistory.findFirst({
        where:   { userId, status: "paid", planId: { not: null } },
        orderBy: { createdAt: "desc" },
        select:  { planId: true, createdAt: true },
      }),
      prisma.project.count({ where: { userId } }),
      prisma.edit.count({ where: { project: { userId } } }),
    ]);

    if (!user) return unauthorized();

    let currentPlan = null;
    if (latestBilling?.planId) {
      const plan = await prisma.plan.findUnique({
        where:  { id: latestBilling.planId },
        select: { id: true, name: true, credits: true, price: true },
      });
      if (plan) {
        currentPlan = {
          id:          plan.id,
          name:        plan.name,
          credits:     plan.credits,
          price:       Number(plan.price),
          purchasedAt: latestBilling.createdAt,
        };
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        avatar:        buildAvatarUrl(user.avatar),
        project_count: projectCount,
        edit_count:    editCount,
        currentPlan,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * @openapi
 * /api/user/profile:
 *   post:
 *     summary: Update user profile (multipart/form-data)
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:     { type: string }
 *               avatar:   { type: string, format: binary }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Updated user profile
 *       422:
 *         description: Validation error
 */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId(req);
    if (!userId) return unauthorized();

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { message: "Request must be multipart/form-data." },
        { status: 400 },
      );
    }

    const name     = formData.get("name") as string | null;
    const password = formData.get("password") as string | null;
    const avatarFile = formData.get("avatar");

    console.log("[profile POST] received fields:", {
      name,
      password: password ? `***${password.length} chars` : null,
      avatar: avatarFile instanceof File
        ? { name: avatarFile.name, type: avatarFile.type, size: avatarFile.size }
        : avatarFile,
    });

    // --- validation (Laravel-style per-field errors) ---
    const errors: ValidationErrors = {};

    if (name !== null && name.trim().length === 0) {
      errors.name = ["The name field must not be empty."];
    } else if (name !== null && name.length > 120) {
      errors.name = ["The name may not be greater than 120 characters."];
    }

    if (password !== null && password.length < 8) {
      errors.password = ["The password must be at least 8 characters."];
    }

    if (avatarFile !== null && !(avatarFile instanceof File)) {
      errors.avatar = ["The avatar must be a file."];
    }

    if (Object.keys(errors).length > 0) {
      console.log("[profile POST] validation failed:", errors);
      return validationError(errors);
    }

    // nothing provided at all
    if (name === null && password === null && avatarFile === null) {
      return NextResponse.json(
        { message: "No fields provided to update." },
        { status: 422 },
      );
    }

    // --- process fields ---
    const updateData: Record<string, unknown> = {};

    if (name !== null) updateData.name = name.trim();

    if (password !== null) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    if (avatarFile instanceof File) {
      try {
        const { filename } = await putFile(avatarFile, "avatars");
        updateData.avatar = filename;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed.";
        return validationError({ avatar: [msg] });
      }
    }

    console.log("[profile POST] saving to DB:", updateData);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, avatar: true },
    });

    return NextResponse.json({
      user: { ...updated, avatar: buildAvatarUrl(updated.avatar) },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
