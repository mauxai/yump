"use client";

import { Icon } from "./Icon";
import { useT } from "@/lib/i18n";

type Brand = { name: string; logo: string; slogan: string };

const FEATURES = [
  {
    icon: "wand" as const,
    title: "Magic AI Canvas & Generative Fill",
    description: "Generate, edit, or extend images effortlessly with natural language prompts.",
  },
  {
    icon: "scissors" as const,
    title: "Smart Object & Background Removal",
    description: "Isolate subjects and erase unwanted clutter with pinpoint accuracy.",
  },
  {
    icon: "sparkles" as const,
    title: "8K Ultra-HD Upscaling",
    description: "Enhance image resolution, restore details, and export production assets.",
  },
];

export function AuthShowcase({ brand }: { brand: Brand }) {
  const { t } = useT();

  return (
    <div className="w-full max-w-[440px] space-y-6">
      {/* Sleek Headline */}
      <div className="space-y-3">
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-fg-0 leading-[1.18]">
          Create, edit, & scale with AI.
        </h1>
        <p className="text-[14px] text-fg-2 leading-relaxed">
          Unlock professional generative canvas tools, smart object manipulation, and cloud workflows.
        </p>
      </div>

      {/* Clean Feature List - Minimalist & Spacious */}
      <div className="space-y-4 pt-1">
        {FEATURES.map((feature, idx) => (
          <div
            key={idx}
            className="group flex items-start gap-4 p-3 rounded-xl hover:bg-bg-2/50 transition-all duration-200"
          >
            {/* Minimalist Icon Box */}
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
              <Icon name={feature.icon} size={18} />
            </div>

            {/* Feature Text */}
            <div className="space-y-0.5 min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold text-fg-0 tracking-tight group-hover:text-accent transition-colors">
                {feature.title}
              </h3>
              <p className="text-[12px] text-fg-2 leading-normal">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthTaglineClient() {
  const { t } = useT();
  return <>{t("auth.tagline")}</>;
}


