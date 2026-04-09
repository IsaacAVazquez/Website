import { Rocket } from "lucide-react";

interface MissionVehiclePhotoProps {
  name: string;
  image: string | null;
  fallbackImage?: string | null;
  className?: string;
  label?: string;
  dataTestId?: string;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function MissionVehiclePhoto({
  name,
  image,
  fallbackImage = null,
  className = "",
  label = "Vehicle view",
  dataTestId,
}: MissionVehiclePhotoProps) {
  const displayImage = image ?? fallbackImage;

  if (displayImage) {
    return (
      <div
        data-testid={dataTestId}
        data-image-src={displayImage}
        aria-hidden="true"
        className={`relative overflow-hidden rounded-[28px] border border-[color-mix(in_srgb,var(--home-haze)_18%,var(--home-rule))] bg-[color-mix(in srgb, var(--home-paper) 92%, white)] bg-center bg-no-repeat shadow-[var(--shadow-md)] ${className}`}
        style={{
          backgroundImage: `linear-gradient(180deg,color-mix(in_srgb,var(--home-paper)_14%,transparent) 0%, transparent 36%, color-mix(in_srgb,var(--home-paper)_76%,transparent) 100%), url(${displayImage})`,
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-x-0 top-0 flex justify-between p-4">
          <span className="rounded-full border border-[color-mix(in_srgb,var(--home-paper)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-paper)_74%,transparent)] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
            {label}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-sm font-semibold text-white">{name}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={dataTestId}
      aria-hidden="true"
      className={`flex items-center justify-center rounded-[28px] border border-[color-mix(in_srgb,var(--home-haze)_18%,var(--home-rule))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--home-haze)_10%,color-mix(in srgb, var(--home-paper) 92%, white))_0%,color-mix(in srgb, var(--home-paper) 92%, white)_72%)] shadow-[var(--shadow-md)] ${className}`}
    >
      <div className="flex flex-col items-center gap-3">
        <Rocket className="h-7 w-7 text-[var(--home-haze)]" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
          {getInitials(name)}
        </span>
      </div>
    </div>
  );
}
