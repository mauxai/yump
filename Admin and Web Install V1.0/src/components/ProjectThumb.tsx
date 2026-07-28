"use client";

import { useState } from "react";

export function ProjectThumb({
  projectId,
  name,
  className = "w-full h-full object-cover",
}: {
  projectId: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "P";

  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-bg-3 text-[13px] font-semibold text-fg-2">
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/projects/${projectId}/thumb`}
      alt={name}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
