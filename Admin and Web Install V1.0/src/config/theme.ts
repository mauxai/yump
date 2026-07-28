/**
 * ─── Theme Configuration ─────────────────────────────────────────────────────
 * Provide plain hex codes. The system generates all tints, shades, and
 * opacity variants automatically — no OKLCH or CSS knowledge required.
 *
 * To retheme the entire UI, edit the hex values below and save.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ThemeColors {
  /** Main brand / accent color. Buttons, links, badges, highlights. */
  primary: string;
  /** Text color rendered ON TOP of the primary/accent background (e.g. button label).
   *  Use a dark value when primary is bright, light value when primary is dark. */
  primaryFg: string;

  /** Deepest background (page canvas) */
  bg0: string;
  /** Card / panel background */
  bg1: string;
  /** Elevated surface (dropdowns, modals) */
  bg2: string;
  /** Highest surface (tooltips, popovers) */
  bg3: string;

  /** Primary text */
  text: string;
  /** Secondary text */
  textMuted: string;
  /** Tertiary / placeholder text */
  textFaint: string;
  /** Disabled / decorative text */
  textGhost: string;

  /** Subtle divider */
  border: string;
  /** Strong divider */
  borderStrong: string;

  /** Destructive / error */
  danger: string;
  /** Informational */
  info: string;
}

// ─── Dark mode ────────────────────────────────────────────────────────────────
const dark: ThemeColors = {
  primary:     "#a3e635",   // lime-green — change this to rebrand
  primaryFg:   "#0a0b0d",   // dark text — lime-green is bright so needs dark label

  bg0:         "#0a0b0d",
  bg1:         "#101216",
  bg2:         "#15181d",
  bg3:         "#1c2027",

  text:        "#f2f3f5",
  textMuted:   "#b6bac2",
  textFaint:   "#7b808b",
  textGhost:   "#4a4e57",

  border:      "rgba(255,255,255,0.06)",
  borderStrong:"rgba(255,255,255,0.10)",

  danger:      "#e05252",
  info:        "#60a5fa",
};

// ─── Light mode ───────────────────────────────────────────────────────────────
const light: ThemeColors = {
  primary:     "#4d7c0f",   // darker shade so it's legible on white
  primaryFg:   "#ffffff",   // white text — dark green needs a light label

  bg0:         "#f6f6f4",
  bg1:         "#ffffff",
  bg2:         "#fafaf8",
  bg3:         "#eeeeea",

  text:        "#111214",
  textMuted:   "#3a3d44",
  textFaint:   "#6a6e77",
  textGhost:   "#a0a4ac",

  border:      "rgba(0,0,0,0.08)",
  borderStrong:"rgba(0,0,0,0.14)",

  danger:      "#dc2626",
  info:        "#2563eb",
};

export const theme = { dark, light } as const;

// ─── CSS variable builder ─────────────────────────────────────────────────────
// accent-soft / accent-line are generated via color-mix() so any hex "just works"

export function buildCssVars(t: ThemeColors): string {
  return [
    /* accent */
    `--accent:${t.primary}`,
    `--accent-fg:${t.primaryFg}`,
    `--accent-soft:color-mix(in srgb,${t.primary} 12%,transparent)`,
    `--accent-line:color-mix(in srgb,${t.primary} 35%,transparent)`,

    /* backgrounds */
    `--bg-0:${t.bg0}`,
    `--bg-1:${t.bg1}`,
    `--bg-2:${t.bg2}`,
    `--bg-3:${t.bg3}`,

    /* text */
    `--fg-0:${t.text}`,
    `--fg-1:${t.textMuted}`,
    `--fg-2:${t.textFaint}`,
    `--fg-3:${t.textGhost}`,

    /* borders */
    `--line:${t.border}`,
    `--line-2:${t.borderStrong}`,

    /* semantic */
    `--danger:${t.danger}`,
    `--info:${t.info}`,

    /* shape */
    `--radius:10px`,
    `--radius-sm:6px`,
  ].join(";");
}
