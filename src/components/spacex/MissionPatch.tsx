import { MissionImageFrame } from "./MissionImageFrame";

interface MissionPatchProps {
  name: string;
  image: string | null;
  className?: string;
  dataTestId?: string;
}

export function MissionPatch({
  name,
  image,
  className = "",
  dataTestId,
}: MissionPatchProps) {
  return (
    <MissionImageFrame
      name={name}
      image={image}
      dataTestId={dataTestId}
      alt={`${name} mission patch`}
      imageFit="contain"
      imageInsetClassName="p-2.5"
      className={`flex items-center justify-center rounded-[var(--radius-3xl)] border border-[color-mix(in_srgb,var(--home-signal)_22%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_7%,var(--home-paper-raised))] shadow-[var(--shadow-md)] ${className}`}
    />
  );
}
