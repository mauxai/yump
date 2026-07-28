import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { unauthorized, handleApiError } from "@/lib/utils/error-handler";
import { saveImageFile } from "@/lib/file-store";
import { toAbsoluteUrl } from "@/lib/utils/url";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page:     z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  q:        z.string().optional(),
});

const createSchema = z.object({
  name:          z.string().min(1).max(120),
  originalImage: z.string().startsWith("data:image/").optional(),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId(req);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(searchParams));

    const where = {
      userId,
      ...(q.q ? { name: { contains: q.q } } : {}),
    };

    const skip = (q.page - 1) * q.pageSize;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: q.pageSize,
        select: {
          id:            true,
          name:          true,
          originalImage: true,
          createdAt:     true,
          updatedAt:     true,
          _count:        { select: { edits: true } },
          edits: {
            orderBy: { createdAt: "desc" },
            take:    1,
            select:  { image: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      projects: projects.map((p) => ({
        id:           p.id,
        name:         p.name,
        edit_count:   p._count.edits,
        thumbnailUrl: toAbsoluteUrl(p.edits[0]?.image ?? p.originalImage),
        createdAt:    p.createdAt.toISOString(),
        updatedAt:    p.updatedAt.toISOString(),
      })),
      total,
      page:       q.page,
      pageSize:   q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

type ValidationErrors = Record<string, string[]>;

function validationError(errors: ValidationErrors) {
  return NextResponse.json(
    { message: "The given data was invalid.", errors },
    { status: 422 },
  );
}

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES    = 5 * 1024 * 1024; // 5 MB
const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png",  webp: "image/webp", gif: "image/gif",
};

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  let name = "";
  let mimeType = "image/png";
  let imageUrl = "";

  if (isMultipart) {
    const form = await req.formData();
    name = ((form.get("name") as string | null) ?? "").trim();
    const file = form.get("image");

    console.log("[project POST] received fields:", {
      name,
      image: file instanceof File
        ? { name: file.name, type: file.type, size: file.size }
        : file,
    });

    // --- validation ---
    const errors: ValidationErrors = {};

    if (!name) {
      errors.name = ["The name field is required."];
    } else if (name.length > 120) {
      errors.name = ["The name may not be greater than 120 characters."];
    }

    if (!file) {
      errors.image = ["The image field is required."];
    } else if (!(file instanceof File)) {
      errors.image = ["The image must be a file."];
    } else {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const resolved = file.type === "application/octet-stream"
        ? (EXT_MIME[ext] ?? file.type)
        : (file.type || "image/png");

      if (!ALLOWED_MIME.includes(resolved)) {
        errors.image = ["The image must be a valid image (jpeg, png, webp, gif)."];
      } else if (file.size > MAX_BYTES) {
        errors.image = ["The image may not be greater than 5 MB."];
      } else {
        mimeType = resolved;
      }
    }

    if (Object.keys(errors).length > 0) {
      console.log("[project POST] validation failed:", errors);
      return validationError(errors);
    }

    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const base64 = buffer.toString("base64");
    imageUrl = await saveImageFile(base64, mimeType, `projects/${userId}`);
    console.log("[project POST] resolved mime:", mimeType, "→ saved:", imageUrl);

  } else {
    // JSON fallback — base64 data URL
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      const errors: ValidationErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "general";
        errors[field] = [...(errors[field] ?? []), issue.message];
      }
      console.log("[project POST] validation failed:", errors);
      return validationError(errors);
    }

    if (!parsed.data.originalImage) {
      return validationError({ image: ["The image field is required."] });
    }

    name = parsed.data.name;
    const dataUrl = parsed.data.originalImage;
    const match   = dataUrl.match(/^data:(.+?);base64,(.*)$/);
    mimeType      = match?.[1] ?? "image/png";
    const base64  = match?.[2] ?? "";
    imageUrl      = base64
      ? await saveImageFile(base64, mimeType, `projects/${userId}`)
      : dataUrl;
  }

  const project = await prisma.project.create({
    data: { userId, name, originalImage: imageUrl },
    select: {
      id:            true,
      name:          true,
      originalImage: true,
      createdAt:     true,
      updatedAt:     true,
    },
  });

  revalidatePath("/");
  return NextResponse.json({
    project: {
      id:           project.id,
      name:         project.name,
      imageUrl:     toAbsoluteUrl(project.originalImage),
      thumbnailUrl: toAbsoluteUrl(project.originalImage),
      edit_count:   0,
      createdAt:    project.createdAt.toISOString(),
      updatedAt:    project.updatedAt.toISOString(),
    },
  }, { status: 201 });
}
