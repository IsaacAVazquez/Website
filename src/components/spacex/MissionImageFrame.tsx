import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Rocket } from "lucide-react";

interface MissionImageFrameProps {
  name: string;
  image: string | null;
  fallbackImage?: string | null;
  className?: string;
  dataTestId?: string;
  alt: string;
  priority?: boolean;
  imageFit?: "cover" | "contain";
  imagePosition?: string;
  imageInsetClassName?: string;
  children?: ReactNode;
}

const INVALID_IMAGE_VALUES = new Set(["", "#", "about:blank", "null", "undefined", "n/a", "none"]);
const VALID_IMAGE_PROTOCOL = /^(https?:\/\/|\/|data:image\/|blob:)/i;

function sanitizeMissionImageSrc(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  if (INVALID_IMAGE_VALUES.has(trimmedValue.toLowerCase())) {
    return null;
  }

  if (!VALID_IMAGE_PROTOCOL.test(trimmedValue)) {
    return null;
  }

  return trimmedValue;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function MissionImageFrame({
  name,
  image,
  fallbackImage = null,
  className = "",
  dataTestId,
  alt,
  priority = false,
  imageFit = "cover",
  imagePosition = "center center",
  imageInsetClassName = "",
  children,
}: MissionImageFrameProps) {
  const candidates = useMemo(
    () =>
      [sanitizeMissionImageSrc(image), sanitizeMissionImageSrc(fallbackImage)].filter(
        (candidate, index, values): candidate is string =>
          Boolean(candidate) && values.indexOf(candidate) === index
      ),
    [fallbackImage, image]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset image carousel index/load state when the candidate image set changes
    setActiveIndex(0);
    setIsLoaded(false);
  }, [candidates]);

  const activeImage = candidates[activeIndex] ?? null;
  const imageState = activeImage ? (isLoaded ? "loaded" : "loading") : "placeholder";

  return (
    <div
      data-testid={dataTestId}
      data-image-src={activeImage ?? undefined}
      data-image-state={imageState}
      data-image-fit={imageFit}
      className={`relative overflow-hidden ${className}`}
      role={activeImage ? undefined : "img"}
      aria-label={activeImage ? undefined : alt}
    >
      <div className="absolute inset-0 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--home-haze)_10%,color-mix(in_srgb,var(--home-paper)_92%,white))_0%,color-mix(in_srgb,var(--home-paper)_92%,white)_72%)]" />

      {activeImage ? (
        <>
          <div className={`absolute inset-0 ${imageInsetClassName}`}>
            <img
              src={activeImage}
              alt={alt}
              referrerPolicy="no-referrer"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              draggable={false}
              className={`h-full w-full transition-opacity duration-300 ${
                imageFit === "contain" ? "object-contain" : "object-cover"
              } ${isLoaded ? "opacity-100" : "opacity-0"}`}
              style={{ objectPosition: imagePosition }}
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                setIsLoaded(false);
                setActiveIndex((currentValue) =>
                  currentValue + 1 < candidates.length ? currentValue + 1 : candidates.length
                );
              }}
            />
          </div>
          {!isLoaded ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 animate-pulse bg-[color-mix(in_srgb,var(--home-paper-alt)_78%,white)]"
            />
          ) : null}
        </>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-3">
            <Rocket className="h-7 w-7 text-[var(--home-haze)]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
              {getInitials(name)}
            </span>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
