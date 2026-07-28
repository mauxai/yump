/**
 * Suggested prompts seeder — run with:
 *   npm run seed:prompts
 *
 * Upserts the editor.suggestedPrompts setting with a curated default list.
 * Safe to re-run — existing value is overwritten.
 */

const DEFAULT_PROMPTS = [
  "Remove the background",
  "Make the sky more dramatic",
  "Add a cinematic color grade",
  "Sharpen and enhance details",
  "Make it look like golden hour",
  "Convert to black and white",
  "Remove unwanted objects",
  "Add a soft bokeh background blur",
  "Brighten the subject",
  "Make colors more vibrant",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedPrompts(prisma: any): Promise<number> {
  const value = JSON.stringify(DEFAULT_PROMPTS);
  await prisma.setting.upsert({
    where:  { key: "editor.suggestedPrompts" },
    update: { value },
    create: { key: "editor.suggestedPrompts", value, category: "editor" },
  });
  return DEFAULT_PROMPTS.length;
}
