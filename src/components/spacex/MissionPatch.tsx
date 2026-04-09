import { Rocket } from "lucide-react";

interface MissionPatchProps {
  name: string;
  image: string | null;
  className?: string;
  dataTestId?: string;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function MissionPatch({
  name,
  image,
  className = "",
  dataTestId,
}: MissionPatchProps) {
  if (image) {
    return (
      <div
        data-testid={dataTestId}
        data-image-src={image}
        aria-hidden="true"
        className={`rounded-[22px] border border-[color-mix(in_srgb,var(--home-haze)_24%,var(--home-rule))] bg-[color-mix(in srgb, var(--home-paper) 92%, white)] bg-center bg-no-repeat shadow-[var(--shadow-md)] ${className}`}
        style={{
          backgroundImage: `linear-gradient(180deg,color-mix(in_srgb,var(--home-paper)_40%,transparent),transparent), url(${image})`,
          backgroundSize: "cover",
        }}
      />
    );
  }

  return (
    <div
      data-testid={dataTestId}
      aria-hidden="true"
      className={`flex items-center justify-center rounded-[22px] border border-[color-mix(in_srgb,var(--home-haze)_22%,var(--home-rule))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--home-haze)_12%,color-mix(in srgb, var(--home-paper) 92%, white))_0%,color-mix(in srgb, var(--home-paper) 92%, white)_72%)] shadow-[var(--shadow-md)] ${className}`}
    >
      <div className="flex flex-col items-center gap-2">
        <Rocket className="h-6 w-6 text-[var(--home-haze)]" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
          {getInitials(name)}
        </span>
      </div>
    </div>
  );
}
