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
      className={`flex items-center justify-center rounded-[22px] border border-[color-mix(in_srgb,var(--home-haze)_22%,var(--home-rule))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--home-haze)_12%,color-mix(in srgb, var(--home-paper) 92%, white))_0%,color-mix(in srgb, var(--home-paper) 92%, white)_72%)] shadow-[var(--shadow-md)] ${className}`}
    />
  );
}
