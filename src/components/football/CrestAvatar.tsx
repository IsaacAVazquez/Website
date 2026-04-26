"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function getTeamInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function CrestAvatar({
  crest,
  name,
  size = "md",
}: {
  crest: string | null | undefined;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const [errored, setErrored] = useState(false);

  const dimensionClass =
    size === "lg"
      ? "h-16 w-16 text-lg"
      : size === "sm"
        ? "h-9 w-9 text-xs"
        : "h-12 w-12 text-sm";

  if (crest && !errored) {
    return (
      <img
        src={crest}
        alt={`${name} crest`}
        loading="lazy"
        decoding="async"
        onError={() => setErrored(true)}
        className={cn(
          "rounded-full border border-[var(--home-rule)] bg-white object-contain p-1",
          dimensionClass,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] font-semibold text-[var(--home-ink)]",
        dimensionClass,
      )}
      aria-label={`${name} initials`}
    >
      {getTeamInitials(name)}
    </div>
  );
}
