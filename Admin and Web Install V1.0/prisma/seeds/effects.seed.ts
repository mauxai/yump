/**
 * Effect presets seeder — run with:
 *   npm run seed:effects
 *
 * Upserts all default effect presets grouped by category.
 * Safe to re-run — existing records are updated, new ones inserted.
 */

type PresetInput = {
  label: string;
  icon: string;
  prompt: string;
  category: string;
  categoryColor: string;
  sortOrder: number;
};

const PRESETS: PresetInput[] = [
  // Enhance
  { category: "Enhance", categoryColor: "text-blue-400", sortOrder: 0,  label: "Enhance Quality", icon: "sparkles",    prompt: "Enhance the overall image quality — sharpen fine details, reduce noise, and improve clarity while keeping it natural." },
  { category: "Enhance", categoryColor: "text-blue-400", sortOrder: 1,  label: "Fix Lighting",    icon: "sun",          prompt: "Fix the lighting to be more natural and balanced. Correct overexposed or underexposed areas and improve shadow detail." },
  { category: "Enhance", categoryColor: "text-blue-400", sortOrder: 2,  label: "Upscale Detail",  icon: "zoomIn",       prompt: "Add fine textures and micro-details to make the image look sharper and more detailed." },
  { category: "Enhance", categoryColor: "text-blue-400", sortOrder: 3,  label: "Denoise",         icon: "sliders",      prompt: "Remove noise and grain from the image while preserving sharp edges and fine details." },

  // Background
  { category: "Background", categoryColor: "text-purple-400", sortOrder: 10, label: "Remove BG",   icon: "scissors",  prompt: "Remove the background completely and place the subject on a clean transparent/white background." },
  { category: "Background", categoryColor: "text-purple-400", sortOrder: 11, label: "Blur BG",     icon: "layers",    prompt: "Blur the background with a professional bokeh effect while keeping the main subject sharp and in focus." },
  { category: "Background", categoryColor: "text-purple-400", sortOrder: 12, label: "Sunset Sky",  icon: "sun",       prompt: "Replace the sky with a dramatic golden-hour sunset sky with warm orange and pink tones." },
  { category: "Background", categoryColor: "text-purple-400", sortOrder: 13, label: "Studio BG",   icon: "image",     prompt: "Replace the background with a clean professional studio gradient background." },

  // Style
  { category: "Style", categoryColor: "text-pink-400", sortOrder: 20, label: "Black & White", icon: "contrast",    prompt: "Convert to dramatic black and white with rich contrast, deep shadows, and bright highlights." },
  { category: "Style", categoryColor: "text-pink-400", sortOrder: 21, label: "Vintage Film",  icon: "film",        prompt: "Apply a vintage analog film look with warm tones, slight grain, faded shadows, and light leaks." },
  { category: "Style", categoryColor: "text-pink-400", sortOrder: 22, label: "Anime Style",   icon: "pen",         prompt: "Convert to an anime/manga illustration style with clean outlines, cel-shading, and vibrant colors." },
  { category: "Style", categoryColor: "text-pink-400", sortOrder: 23, label: "Watercolor",    icon: "droplet",     prompt: "Transform into a beautiful watercolor painting with soft brush strokes and natural color bleeds." },
  { category: "Style", categoryColor: "text-pink-400", sortOrder: 24, label: "Oil Painting",  icon: "paintBucket", prompt: "Convert to a rich classical oil painting style with visible brush strokes and deep, textured colors." },
  { category: "Style", categoryColor: "text-pink-400", sortOrder: 25, label: "Pencil Sketch", icon: "pencil",      prompt: "Transform into a detailed pencil sketch drawing with realistic crosshatch shading." },
  { category: "Style", categoryColor: "text-pink-400", sortOrder: 26, label: "Cyberpunk",     icon: "bolt",        prompt: "Apply a cyberpunk aesthetic — neon lights, rain reflections, futuristic urban atmosphere in teal and magenta." },
  { category: "Style", categoryColor: "text-pink-400", sortOrder: 27, label: "Neon Glow",     icon: "sparkles",    prompt: "Add dramatic neon glow effects with vibrant purple, cyan, and pink colors against a dark background." },

  // Portrait
  { category: "Portrait", categoryColor: "text-amber-400", sortOrder: 30, label: "Smooth Skin",   icon: "faceSmile", prompt: "Smooth and enhance skin texture naturally — reduce blemishes and even out tone while keeping features realistic." },
  { category: "Portrait", categoryColor: "text-amber-400", sortOrder: 31, label: "Brighten Eyes", icon: "eye",       prompt: "Brighten and sharpen the eyes, enhance their color and make them look more vivid and expressive." },
  { category: "Portrait", categoryColor: "text-amber-400", sortOrder: 32, label: "Professional",  icon: "user",      prompt: "Dress the person in a complete professional outfit — a well-fitted blazer, dress shirt, and formal trousers or suit pants. Keep the person's face, skin tone, hair, and pose exactly the same. Improve lighting to a clean studio look suitable for a corporate headshot." },
  { category: "Portrait", categoryColor: "text-amber-400", sortOrder: 33, label: "Young & Fresh", icon: "sparkles",  prompt: "Make the person look younger and fresher — brighter skin, improved lighting, and a more energetic expression." },

  // Color Grade
  { category: "Color Grade", categoryColor: "text-emerald-400", sortOrder: 40, label: "Warm Tones", icon: "sun",    prompt: "Shift the color grade to warm golden tones — increase warmth, yellows, and oranges for a cozy sunny feel." },
  { category: "Color Grade", categoryColor: "text-emerald-400", sortOrder: 41, label: "Cool Tones", icon: "moon",   prompt: "Apply a cool color grade with clean blue tones for a modern, crisp, and cinematic look." },
  { category: "Color Grade", categoryColor: "text-emerald-400", sortOrder: 42, label: "Cinematic",  icon: "film",   prompt: "Apply a professional cinematic color grade — teal shadows, orange highlights, and reduced saturation for a film look." },
  { category: "Color Grade", categoryColor: "text-emerald-400", sortOrder: 43, label: "Vivid",      icon: "palette", prompt: "Boost colors to be more vivid and saturated — increase contrast and make every hue pop." },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedEffects(prisma: any): Promise<number> {
  let upserted = 0;
  for (const p of PRESETS) {
    await prisma.effectPreset.upsert({
      where: { label_category: { label: p.label, category: p.category } },
      update: { icon: p.icon, prompt: p.prompt, categoryColor: p.categoryColor, sortOrder: p.sortOrder },
      create: { label: p.label, icon: p.icon, prompt: p.prompt, category: p.category, categoryColor: p.categoryColor, sortOrder: p.sortOrder, isActive: true },
    });
    upserted++;
  }
  return upserted;
}
