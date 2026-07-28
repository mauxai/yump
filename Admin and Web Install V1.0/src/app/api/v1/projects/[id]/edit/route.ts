import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { editImage, editImageWithModel } from "@/lib/ai-engine";
import { saveImageFile, readImageAsBuffer } from "@/lib/file-store";
import { toAbsoluteUrl } from "@/lib/utils/url";
import { sendPushNotification, sendPushToTopic, panelTopic } from "@/lib/firebase-push";
import { getSetting } from "@/lib/settings";

export const maxDuration = 120;

const schema = z.object({
  prompt: z.string().min(1).max(10000).optional(),
  parentId: z.string().nullable().optional(),
  sourceImageOverride: z.string().startsWith("data:image/").optional(),
  isRegionEdit: z.boolean().optional(),
  isBrushEdit: z.boolean().optional(),
  aiModelId: z.string().optional(),
  templateId: z.string().min(1).optional(),         // DB id of Template record — resolves imageUrl/prompt automatically
  templateImageUrl: z.string().min(1).optional(),   // template image (used by OpenAI for reference)
  templatePrompt: z.string().min(1).optional(),     // template scene description (used by Gemini for text-guided transform)
}).refine(
  (d) => !!d.prompt || !!d.templateId,
  { message: "Either prompt or templateId is required", path: ["prompt"] },
);

// For lasso: green dashed outline marks a region to edit inside.
const REGION_WRAPPER = (userPrompt: string) =>
  `You are editing an image. The user has marked a specific region using a bright green dashed outline. Apply the following edit ONLY to the content strictly inside the outlined region, and REMOVE the green dashed outline entirely from your output. Keep every pixel outside the outlined region identical to the input image.

Edit instruction: ${userPrompt}`;

// For brush: solid green strokes are a hand-drawn sketch of the object to place.
const BRUSH_SKETCH_WRAPPER = (userPrompt: string, isSketchOnly: boolean) =>
  isSketchOnly
    ? `The image contains solid green brush strokes that form a hand-drawn sketch. Your task:
1. Carefully study the exact shape, contours, proportions, and position of the green strokes to identify the specific object being drawn.
2. Replace the green strokes with a photorealistic rendering of that exact object — use the stroke outline as a precise silhouette guide.
3. Match the object's size and position exactly to the drawn sketch.
4. Apply realistic textures, lighting, shadows, and perspective that seamlessly integrate with the existing scene.
5. Remove ALL green strokes completely from the output.
6. Keep every pixel outside the sketched area identical to the original.`
    : `The image contains solid green brush strokes marking an area. Apply the following edit to that marked area, then remove all green strokes from the output. Keep every pixel outside the green area identical to the original.

Edit instruction: ${userPrompt}`;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    return await handleEdit(req, params.id);
  } catch (e) {
    console.error("[edit] unhandled error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

async function handleEdit(req: Request, projectId: string) {
  // Public demo ships with AI editing disabled. Enforced server-side because
  // the client guard alone can be bypassed by calling this route directly.
  if (process.env.NEXT_PUBLIC_IS_DEMO_MODE === "true") {
    return NextResponse.json({ error: "AI editing is disabled in the demo." }, { status: 403 });
  }

  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  // Parse body — multipart (binary drawing file) or JSON (base64 fallback)
  let fields: Record<string, unknown> = {};
  let drawingBuffer: Buffer | null = null;
  let drawingMime = "image/png";

  if (isMultipart) {
    const form = await req.formData();
    for (const [key, value] of form.entries()) {
      if (key === "drawing" && value instanceof File) {
        const ext = value.name.split(".").pop()?.toLowerCase() ?? "";
        const extMimeMap: Record<string, string> = {
          jpg: "image/jpeg", jpeg: "image/jpeg",
          png: "image/png", webp: "image/webp", gif: "image/gif",
        };
        drawingMime = value.type === "application/octet-stream"
          ? (extMimeMap[ext] ?? "image/png")
          : (value.type || "image/png");
        drawingBuffer = Buffer.from(await value.arrayBuffer());
      } else if (typeof value === "string") {
        fields[key] = value;
      }
    }
    fields.isRegionEdit = fields.isRegionEdit === "true";
    fields.isBrushEdit  = fields.isBrushEdit  === "true";
    fields.parentId     = fields.parentId ?? null;
  } else {
    fields = await req.json().catch(() => null) ?? {};
  }

  console.log("[edit POST] received fields:", {
    prompt: fields.prompt,
    parentId: fields.parentId ?? null,
    isRegionEdit: fields.isRegionEdit,
    isBrushEdit: fields.isBrushEdit,
    aiModelId: fields.aiModelId ?? null,
    sourceImageOverride: fields.sourceImageOverride ? "<base64 present>" : null,
    drawing: drawingBuffer
      ? { size: drawingBuffer.length, mime: drawingMime }
      : null,
  });

  const parsed = schema.safeParse(fields);
  if (!parsed.success) {
    console.log("[edit POST] validation failed:", parsed.error.issues);
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const [user, project, template] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.project.findFirst({ where: { id: projectId, userId } }),
    parsed.data.templateId
      ? prisma.template.findFirst({ where: { id: parsed.data.templateId, isActive: true } })
      : Promise.resolve(null),
  ]);

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (parsed.data.templateId && !template) {
    return NextResponse.json({ error: "Template not found or inactive" }, { status: 404 });
  }

  let creditCost = 1;
  let modelProvider = "openai";
  if (parsed.data.aiModelId) {
    const model = await prisma.aiModel.findUnique({
      where: { id: parsed.data.aiModelId },
      select: { creditCost: true, provider: true },
    });
    if (model) {
      creditCost = model.creditCost;
      modelProvider = model.provider;
    }
  }

  console.log("[edit POST] credits:", {
    used: user.creditsUsed,
    total: user.creditsTotal,
    cost: creditCost,
    enough: user.creditsUsed + creditCost <= user.creditsTotal,
  });

  if (user.creditsUsed + creditCost > user.creditsTotal) {
    return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
  }

  // Resolve base image — client override > parent edit > project original.
  // Pass buffer directly to skip double base64 conversion in providers.
  let baseInput: { buffer?: Buffer; dataUrl?: string; mimeType: string; referenceImages?: { buffer: Buffer; mimeType: string }[] };
  const parentId = parsed.data.parentId ?? null;

  if (drawingBuffer) {
    // Multipart binary upload — composited drawing from client canvas, no base64 overhead.
    baseInput = { buffer: drawingBuffer, mimeType: drawingMime };
  } else if (parsed.data.sourceImageOverride) {
    // Legacy JSON base64 fallback — browser canvas composite as data URL.
    baseInput = {
      dataUrl: parsed.data.sourceImageOverride,
      mimeType: parsed.data.sourceImageOverride.match(/^data:(.+?);base64/)?.[1] ?? "image/png",
    };
  } else if (parentId) {
    const parent = await prisma.edit.findFirst({
      where: { id: parentId, projectId: project.id },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent version not found" }, { status: 404 });
    }
    const { buffer, mimeType } = await readImageAsBuffer(parent.image);
    baseInput = { buffer, mimeType };
  } else {
    const { buffer, mimeType } = await readImageAsBuffer(project.originalImage);
    baseInput = { buffer, mimeType };
  }

  // Resolve template fields — templateId takes precedence over raw templateImageUrl/templatePrompt.
  const effectiveTemplateImageUrl = template?.imageUrl ?? parsed.data.templateImageUrl;
  const effectiveTemplatePrompt   = template?.prompt   ?? parsed.data.templatePrompt;
  // Resolve stored prompt — template edits use "Template: <title>", others use user's input.
  const storedPrompt: string = template
    ? `Template: ${template.title}`
    : parsed.data.prompt!;

  // Template composite — strategy differs by provider:
  //
  // OpenAI (inpainting model):
  //   Base = template image, Reference = user photo.
  //   "Edit Image 1 — keep scene, replace face with Image 2's face."
  //
  // Google/Gemini (generative model — cannot truly edit two images):
  //   Base = user's photo (their face is the subject Gemini will keep).
  //   No reference image — instead the template's text prompt describes the target scene.
  //   "Transform this person to match the following scene/style: [template prompt]."
  if (effectiveTemplateImageUrl) {
    try {
      let tplPath = effectiveTemplateImageUrl;
      try { tplPath = new URL(tplPath).pathname; } catch { /* relative path */ }

      if (modelProvider === "google") {
        // Gemini is a generative model — giving it two images to composite causes it to echo
        // the template back unchanged. It works best with one image (user photo) + text instruction.
        // baseInput is already the user's photo; no image swap needed.
      } else {
        // OpenAI: swap — template becomes the base, user photo becomes reference
        const { buffer: tplBuffer, mimeType: tplMime } = await readImageAsBuffer(tplPath);
        const userImage = baseInput.buffer
          ? { buffer: baseInput.buffer, mimeType: baseInput.mimeType }
          : baseInput.dataUrl
          ? (() => {
              const m = baseInput.dataUrl!.match(/^data:(.+?);base64,(.*)$/);
              return m ? { buffer: Buffer.from(m[2], "base64"), mimeType: m[1] } : null;
            })()
          : null;
        baseInput = {
          buffer: tplBuffer,
          mimeType: tplMime,
          referenceImages: userImage ? [userImage] : [],
        };
      }
    } catch (e) {
      console.warn("[edit] could not load template image:", e instanceof Error ? e.message : e);
    }
  }

  // Build provider-specific prompt for template composites
  let builtTemplatePrompt: string | null = null;

  if (effectiveTemplateImageUrl) {
    if (modelProvider === "google") {
      // Gemini receives only the user's photo + this text instruction.
      // Passing the template image causes Gemini to echo it back unchanged (it's generative, not inpainting).
      const sceneDescription = effectiveTemplatePrompt ?? "a professional studio portrait with a neutral background";
      builtTemplatePrompt =
        `Transform the person in this photo to match the following target scene/style exactly: ${sceneDescription}. ` +
        `Keep the person's face, skin tone, eyes, nose, mouth shape, beard, and expression exactly as they appear in this photo — do not change their facial features. ` +
        `Change only their clothing, hairstyle, pose, background, and lighting to precisely match the target scene described above. ` +
        `The final result must be a photorealistic portrait that looks like a real photograph.`;
    } else {
      // OpenAI: template is the base image, user photo is the reference.
      // Inject the scene description so the AI can adapt face lighting/skin tone to match the scene.
      const sceneContext = effectiveTemplatePrompt
        ? `\n\nScene context for accurate face blending: ${effectiveTemplatePrompt}`
        : "";
      builtTemplatePrompt =
        `You are a professional photo compositor editing this template scene.` +
        `${sceneContext}` +
        `\n\nTask:` +
        `\n1. Keep all scene elements exactly as shown: background, lighting, shadows, clothing style and color, body pose, depth of field, and color grading.` +
        `\n2. Replace the face AND all exposed skin areas — including neck, ears, shoulders, forearms, and hands — with those from the reference photo. Use the reference person's exact skin tone and texture throughout.` +
        `\n3. Adapt the transferred skin to match the scene's lighting: apply the same light direction, color temperature, and shadow intensity from the scene context above so the skin looks naturally lit.` +
        `\n4. Preserve all facial details from the reference exactly: eyes, nose, mouth, jawline, beard, eyebrows, and expression — do not alter any facial feature.` +
        `\n5. Blend every transition edge (hairline, jaw, neckline, sleeve edges, collar) seamlessly — no visible seam, color mismatch, or lighting discontinuity.` +
        `\nOutput a single photorealistic photograph that looks captured in one shot.`;
    }
  }

  const userPrompt = parsed.data.prompt ?? "";
  const modelPrompt: string = parsed.data.isBrushEdit
    ? BRUSH_SKETCH_WRAPPER(userPrompt, userPrompt === "__sketch__")
    : parsed.data.isRegionEdit
      ? REGION_WRAPPER(userPrompt)
      : builtTemplatePrompt ?? userPrompt;

  console.log("[edit POST] calling AI:", {
    model: parsed.data.aiModelId ?? "default",
    promptLength: modelPrompt.length,
    referenceImages: baseInput.referenceImages?.length ?? 0,
    baseInput: baseInput.buffer
      ? { source: "buffer", size: baseInput.buffer.length, mime: baseInput.mimeType }
      : { source: "dataUrl", mime: baseInput.mimeType },
  });

  let result;
  try {
    result = parsed.data.aiModelId
      ? await editImageWithModel(parsed.data.aiModelId, baseInput, modelPrompt)
      : await editImage(baseInput, modelPrompt);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Scope 7: surface content-policy rejections as a clear 400 instead of opaque 502
    const isPolicy =
      msg.includes("safety") ||
      msg.includes("content_policy") ||
      msg.includes("content policy") ||
      msg.includes("moderation") ||
      msg.includes("violates");
    if (isPolicy) {
      return NextResponse.json(
        { error: "The AI declined this edit due to content policy. Try rephrasing your prompt or using a different image." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Save AI result to file storage — store URL in DB instead of raw base64.
  const imageUrl = await saveImageFile(
    result.imageBase64,
    result.mimeType,
    `projects/${userId}/edits`,
  );

  const [edit] = await prisma.$transaction([
    prisma.edit.create({
      data: {
        projectId:  project.id,
        parentId,
        aiModelId:  parsed.data.aiModelId ?? null,
        creditCost,
        prompt:     storedPrompt,
        image:      imageUrl,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { creditsUsed: { increment: creditCost } },
    }),
    prisma.project.update({
      where: { id: project.id },
      data: { updatedAt: new Date() },
    }),
    ...(template
      ? [prisma.template.update({ where: { id: template.id }, data: { usageCount: { increment: 1 } } })]
      : []),
  ]);

  revalidatePath("/");
  revalidatePath(`/editor/${project.id}`);

  // Save in-app notification + fire FCM push — both non-blocking
  const notifTitle = template ? "Template applied" : "Image ready";
  const notifBody  = template
    ? `"${template.title}" has been applied to ${project.name}.`
    : `Your edit on "${project.name}" is complete.`;
  const notifId      = `ntf_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const editImageUrl = toAbsoluteUrl(edit.image);
  const notifData    = JSON.stringify({
    project_id:        project.id,
    project_name:      project.name,
    edit_id:           edit.id,
    image:             editImageUrl,
    notification_type: "edit_completed",
  });

  prisma.$executeRaw`
    INSERT INTO notifications (id, user_id, title, body, data, is_read, created_at)
    VALUES (${notifId}, ${userId}, ${notifTitle}, ${notifBody}, ${notifData}, 0, NOW(3))
  `.catch(() => {});

  if ((await getSetting("firebase.enabled", "false")) === "true") {
    const pushPayload = {
      title:    notifTitle,
      body:     notifBody,
      imageUrl: editImageUrl,
      data: {
        project_id:        project.id,
        project_name:      project.name,
        edit_id:           edit.id,
        image:             editImageUrl,
        notification_type: "edit_completed",
      },
    };

    // App: send directly to the user's stored FCM token
    prisma.$queryRaw<[{ fcm_token: string | null }]>`
      SELECT fcm_token FROM users WHERE id = ${userId} LIMIT 1
    `
      .then(([row]) => {
        if (row?.fcm_token) return sendPushNotification(row.fcm_token, pushPayload);
      })
      .catch(() => {});

    // Web panel: send to the user's unique topic (covers all subscribed browser tabs/devices)
    sendPushToTopic(panelTopic(userId), pushPayload).catch(() => {});
  }

  return NextResponse.json({
    edit: {
      id: edit.id,
      parentId: edit.parentId,
      prompt: edit.prompt,
      image: toAbsoluteUrl(edit.image),
      createdAt: edit.createdAt,
    },
    creditsUsed: user.creditsUsed + creditCost,
    creditsTotal: user.creditsTotal,
  });
}
