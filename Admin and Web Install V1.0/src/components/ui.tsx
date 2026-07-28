"use client";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type ButtonVariant = "default" | "primary" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
};

export function Button({
  variant = "default",
  size = "md",
  icon,
  iconRight,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap transition-colors disabled:opacity-60 disabled:cursor-not-allowed rounded-[6px]";

  const variants: Record<ButtonVariant, string> = {
    default:
      "bg-bg-2 text-fg-0 border border-line-2 hover:bg-bg-3",
    primary:
      "bg-accent text-[var(--accent-fg)] border border-transparent font-semibold hover:brightness-110",
    ghost:
      "bg-transparent text-fg-1 border border-transparent hover:bg-bg-2",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "h-[26px] px-[10px] text-[12px]",
    md: "h-9 px-[14px] text-[13px]",
    lg: "h-[40px] px-[16px] text-[14px]",
    icon: "w-[32px] h-[32px] p-0 text-[13px]",
  };

  return (
    <button type="button" className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={14} /> : null}
    </button>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { icon?: IconName; suffix?: ReactNode };

export function Input({ icon, suffix, className = "", ...rest }: InputProps) {
  return (
    <div className="relative flex items-center">
      {icon ? (
        <Icon name={icon} size={14} className="absolute left-3 text-fg-2 pointer-events-none" />
      ) : null}
      <input
        className={`w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none transition-colors focus:border-accent-line focus:bg-bg-1 ${
          icon ? "pl-9" : "px-3"
        } ${suffix ? "pr-9" : "pr-3"} ${className}`}
        {...rest}
      />
      {suffix ? (
        <div className="absolute right-0 flex items-center justify-center w-9 h-9">
          {suffix}
        </div>
      ) : null}
    </div>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", children, ...rest }: SelectProps) {
  return (
    <select
      className={`w-full h-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none transition-colors focus:border-accent-line focus:bg-bg-1 px-3 appearance-none bg-[length:14px] bg-no-repeat bg-[right_10px_center] ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23808089' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")",
        paddingRight: 32,
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center text-[12px] text-fg-1 mb-2 font-medium">{children}</div>
  );
}

type BadgeTone = "default" | "accent" | "muted";
export function Badge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const tones: Record<BadgeTone, string> = {
    default: "bg-bg-3 text-fg-1 border-line-2",
    accent: "bg-accent-soft text-accent border-accent-line",
    muted: "bg-transparent text-fg-2 border-line",
  };
  return (
    <span
      className={`mono inline-flex items-center gap-[6px] h-[22px] px-2 text-[11px] font-medium rounded tracking-[0.2px] border ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function CreditsRing({
  used,
  total,
  size = 28,
}: {
  used: number;
  total: number;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(1, 1 - used / total));
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const low = pct < 0.3;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-2)" strokeWidth="2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={low ? "var(--danger)" : "var(--accent)"}
          strokeWidth="2"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .4s ease" }}
        />
      </svg>
    </div>
  );
}
