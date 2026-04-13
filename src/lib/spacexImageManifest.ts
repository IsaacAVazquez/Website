import generatedManifest from "@/data/spacexImageManifest.generated.json";

export type SpaceXImageManifest = Record<string, string>;

let manifestOverride: SpaceXImageManifest | null = null;

function getActiveManifest(): SpaceXImageManifest {
  return manifestOverride ?? (generatedManifest as SpaceXImageManifest);
}

export function resolveSpaceXImageUrl(
  url: string | null | undefined,
  manifest: SpaceXImageManifest = getActiveManifest()
): string | null {
  if (typeof url !== "string") {
    return null;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return null;
  }

  if (trimmedUrl.startsWith("/")) {
    return trimmedUrl;
  }

  return manifest[trimmedUrl] ?? trimmedUrl;
}

export function resolveSpaceXImageUrls(
  urls: Array<string | null | undefined>,
  manifest: SpaceXImageManifest = getActiveManifest()
): string[] {
  const resolved = urls
    .map((url) => resolveSpaceXImageUrl(url, manifest))
    .filter((url): url is string => Boolean(url));

  return Array.from(new Set(resolved));
}

export function setSpaceXImageManifestForTests(
  manifest: SpaceXImageManifest | null
): void {
  manifestOverride = manifest;
}
