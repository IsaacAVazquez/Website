import { MissionImageFrame } from "./MissionImageFrame";

interface MissionVehiclePhotoProps {
  name: string;
  image: string | null;
  fallbackImage?: string | null;
  className?: string;
  label?: string;
  dataTestId?: string;
}

export function MissionVehiclePhoto({
  name,
  image,
  fallbackImage = null,
  className = "",
  label = "Vehicle view",
  dataTestId,
}: MissionVehiclePhotoProps) {
  return (
    <MissionImageFrame
      name={name}
      image={image}
      fallbackImage={fallbackImage}
      dataTestId={dataTestId}
      alt={`${name} ${label.toLowerCase()}`}
      priority={dataTestId === "mission-hero-visual"}
      className={`flex items-center justify-center rounded-[28px] border border-[color-mix(in_srgb,var(--home-haze)_18%,var(--home-rule))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--home-haze)_10%,color-mix(in srgb, var(--home-paper) 92%, white))_0%,color-mix(in srgb, var(--home-paper) 92%, white)_72%)] shadow-[var(--shadow-md)] ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--home-paper)_10%,transparent)_0%,transparent_36%,color-mix(in_srgb,var(--home-paper)_78%,transparent)_100%)]"
      />
      <div className="absolute inset-x-0 top-0 flex justify-between p-4">
        <span className="rounded-full border border-[color-mix(in_srgb,var(--home-paper)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-paper)_74%,transparent)] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
          {label}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-sm font-semibold text-white">{name}</p>
      </div>
    </MissionImageFrame>
  );
}
