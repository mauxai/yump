"use client";

import { useState } from "react";
import { buildAvatarUrl } from "@/lib/storage-url";

export function UserAvatar({
  src,
  name,
  size = "sm",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const resolvedUrl = buildAvatarUrl(src);
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const sizeClass = {
    sm: "w-7 h-7 text-[11px]",
    md: "w-10 h-10 text-[14px]",
    lg: "w-14 h-14 text-[20px]",
  }[size];

  return (
    <div className={`${sizeClass} rounded-full bg-bg-3 border border-line-2 shrink-0 overflow-hidden flex items-center justify-center font-semibold text-fg-0`}>
      {resolvedUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        initial
      )}
    </div>
  );
}
