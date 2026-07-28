/**
 * Describe an image using the active AI model and return a generation prompt.
 * Used by the Templates feature to auto-generate prompts from uploaded images.
 * Supports Google/Gemini and OpenAI vision models.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { prisma } from "@/lib/prisma";

const SYSTEM_PROMPT = `You are an expert at writing scene transformation descriptions for AI-powered portrait editing.

Analyze this image and write a scene description that allows an AI to transform a DIFFERENT person's portrait photo to match this exact scene — while keeping that person's face, identity, and skin tone completely unchanged.

Describe ONLY elements that belong to the scene (not the person):
- Background & environment: location, setting, indoor/outdoor, architecture, objects, props
- Lighting: direction (left/right/front/back), quality (soft/harsh/diffused), color temperature (warm/cool/neutral), time of day, light sources
- Clothing & outfit: style, color, fabric, cut, accessories, formality level
- Hairstyle: length, color, texture, style — only if clearly visible and part of the scene look
- Atmosphere & mood: color grading, film look, bokeh, depth of field, overall tone
- Camera & composition: angle, focal length feel, framing, grain, aspect ratio

STRICT RULES — never include these:
- The person's face, eyes, nose, mouth, jawline, or any facial feature
- Skin tone, complexion, ethnicity, age, or physical appearance of the subject
- Expressions, emotions, or personality of the person
- Any description that would identify or alter the subject's identity

Return ONLY the scene description — no preamble, no labels, no explanation.
Write 3–6 sentences. Be specific about lighting direction, clothing details, and environment.
The description will be injected directly into an AI image transformation prompt.`;

export async function describeImageForTemplate(
  imageBuffer: Buffer,
  mimeType: string,
  preferredModelId?: string,
): Promise<string> {
  // Resolve the requested model from DB to determine provider
  const requested = preferredModelId
    ? await prisma.aiModel.findFirst({ where: { id: preferredModelId } })
    : null;

  const provider = requested?.provider ?? "google";

  if (provider === "openai") {
    return describeWithOpenAI(imageBuffer, mimeType, requested);
  }

  return describeWithGoogle(imageBuffer, mimeType, requested);
}

async function describeWithOpenAI(
  imageBuffer: Buffer,
  _mimeType: string,
  model: { credentials: unknown; modelId: string } | null,
): Promise<string> {
  const creds = model?.credentials as Record<string, string> | null;
  const apiKey = creds?.apiKey ?? process.env.OPENAI_API_KEY;
  const organizationId = creds?.organizationId ?? process.env.OPENAI_ORG_ID;

  if (!apiKey) {
    throw new Error(
      "No OpenAI API key found. Configure one in Admin → AI Models or set OPENAI_API_KEY.",
    );
  }

  const openai = createOpenAI({ apiKey, ...(organizationId ? { organization: organizationId } : {}) });

  const result = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: imageBuffer },
          { type: "text", text: SYSTEM_PROMPT },
        ],
      },
    ],
  });

  const text = result.text?.trim();
  if (!text) throw new Error("AI returned an empty response. Try again.");
  return text;
}

async function describeWithGoogle(
  imageBuffer: Buffer,
  mimeType: string,
  model: { credentials: unknown; modelId: string; provider: string } | null,
): Promise<string> {
  let googleModel = model?.provider === "google" ? model : null;

  if (!googleModel) {
    googleModel = await prisma.aiModel.findFirst({
      where: { provider: "google", isActive: true },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  const apiKey =
    (googleModel?.credentials as Record<string, string> | null)?.apiKey ??
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No Google/Gemini API key found. Configure one in Admin → AI Models or set GEMINI_API_KEY.",
    );
  }

  // gemini-2.0-flash-exp does not support generateContent via v1beta — use a stable vision model
  const rawModelId = googleModel?.modelId ?? "gemini-2.5-flash-image";
  const modelId = rawModelId === "gemini-2.0-flash-exp" ? "gemini-2.5-flash" : rawModelId;

  const google = createGoogleGenerativeAI({ apiKey });

  const result = await generateText({
    model: google(modelId),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: imageBuffer,
            mediaType: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          },
          { type: "text", text: SYSTEM_PROMPT },
        ],
      },
    ],
    providerOptions: {
      google: { responseModalities: ["TEXT"] },
    },
  });

  const text = result.text?.trim();
  if (!text) {
    throw new Error("AI returned an empty response. Try again.");
  }
  return text;
}
