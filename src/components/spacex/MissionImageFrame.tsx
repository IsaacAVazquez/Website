import { type ReactNode, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Rocket } from "lucide-react";

interface MissionImageFrameProps {
  name: string;
  image: string | null;
  fallbackImage?: string | null;
  className?: string;
  dataTestId?: string;
  alt: string;
  priority?: boolean;
  /** Catalog 97 surface for the frame, when its overlay text needs a fixed ground. */
  surface?: "espresso" | "paper";
  /** The width of the frame on the page, as a `sizes` value. */
  sizes?: string;
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

/** A path under /public, as opposed to another host or an inline image. */
function isStoredWithSite(source: string): boolean {
  return source.startsWith("/") && !source.startsWith("//");
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
  surface,
  sizes = "100vw",
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
      data-c97-surface={surface}
      className={`relative overflow-hidden ${className}`}
      role={activeImage ? undefined : "img"}
      aria-label={activeImage ? undefined : alt}
    >
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--c97-accent)_6%,var(--c97-field))]" />

      {activeImage ? (
        <>
          <div className="absolute inset-0">
            <Image
              src={activeImage}
              alt={alt}
              fill
              // The width the caller measured for its frame, so the browser
              // can ask for a file near that size. The originals run to
              // 4096px and 2.6 MB.
              sizes={sizes}
              // Only files stored with the site go through the optimizer.
              // Launch Library's hosts are not in next.config's
              // remotePatterns, so those load as they are.
              unoptimized={!isStoredWithSite(activeImage)}
              referrerPolicy="no-referrer"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              draggable={false}
              className={`object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
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
              className="absolute inset-0 animate-pulse bg-[color-mix(in_srgb,var(--c97-field)_78%,var(--c97-field))]"
            />
          ) : null}
        </>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-3">
            <Rocket className="h-7 w-7 text-[var(--c97-accent)]" />
            <span className="font-mono text-3xs font-semibold uppercase tracking-[0.28em] text-[var(--c97-label)]">
              {getInitials(name)}
            </span>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
