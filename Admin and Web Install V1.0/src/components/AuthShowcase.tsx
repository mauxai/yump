"use client";

import { Icon } from "./Icon";
import { useT } from "@/lib/i18n";

type Brand = { name: string; logo: string; slogan: string };

const FEATURES = [
  {
    icon: "wand" as const,
    badge: "Generative AI",
    title: "Magic AI Canvas & Generative Fill",
    description: "Transform and edit any image using simple natural language prompts and intuitive brush controls.",
    accentColor: "from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30",
  },
  {
    icon: "scissors" as const,
    badge: "Precision Tools",
    title: "Lasso Selection & Object Removal",
    description: "Effortlessly select, erase, or replace objects and backgrounds with surgical accuracy.",
    accentColor: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    icon: "sparkles" as const,
    badge: "HD Export",
    title: "Ultra-HD Upscaling & Vector Exports",
    description: "Enhance details to crisp 8K resolution and export production-ready vector graphics.",
    accentColor: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
  },
  {
    icon: "cpu" as const,
    badge: "High-Speed",
    title: "Instant Cloud GPU Acceleration",
    description: "Experience zero-lag creation powered by enterprise-grade parallel GPU rendering clusters.",
    accentColor: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    icon: "layers" as const,
    badge: "Cloud Sync",
    title: "Workspace History & Asset Management",
    description: "Save drafts automatically, access full non-destructive edit history, and manage brand kits.",
    accentColor: "from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30",
  },
];

export function AuthShowcase({ brand }: { brand: Brand }) {
  const { t } = useT();

  return (
    <div className="w-full max-w-[480px] space-y-6">
      {/* Headline & Slogan Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium bg-accent/10 text-accent border border-accent/20">
          <Icon name="sparkles" size={14} />
          <span>{brand.slogan || "Next-Generation Creative AI Studio"}</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-fg-0 leading-tight">
          Everything you need to create, edit, & scale with AI
        </h1>
        <p className="text-[14px] text-fg-2 leading-relaxed">
          Unleash professional photo editing, generative canvas tools, and cloud workflows designed for creators.
        </p>
      </div>

      {/* Feature Cards List */}
      <div className="space-y-3.5 pt-1">
        {FEATURES.map((feature, idx) => (
          <div
            key={idx}
            className="group relative flex items-start gap-4 p-3.5 rounded-xl border border-line/70 bg-bg-2/60 hover:bg-bg-2 hover:border-line hover:shadow-lg transition-all duration-300 backdrop-blur-sm"
          >
            {/* Icon Box */}
            <div className={`p-2.5 rounded-lg bg-gradient-to-br ${feature.accentColor} border shrink-0 group-hover:scale-105 transition-transform duration-300`}>
              <Icon name={feature.icon} size={20} />
            </div>

            {/* Feature Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-[14px] font-semibold text-fg-0 group-hover:text-accent transition-colors">
                  {feature.title}
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-bg-1 border border-line text-fg-2 shrink-0">
                  {feature.badge}
                </span>
              </div>
              <p className="text-[12px] text-fg-2 leading-normal">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Badges / Trust bar */}
      <div className="pt-3 flex items-center justify-between text-[12px] text-fg-3 border-t border-line/40">
        <span className="flex items-center gap-1.5">
          <Icon name="bolt" size={13} className="text-amber-400" /> Instant Processing
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="globe" size={13} className="text-cyan-400" /> 99.9% Cloud Uptime
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="lock" size={13} className="text-emerald-400" /> Private & Secure
        </span>
      </div>
    </div>
  );
}

export function AuthTaglineClient() {
  const { t } = useT();
  return <>{t("auth.tagline")}</>;
}

