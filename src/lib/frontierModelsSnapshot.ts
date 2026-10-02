import { frontierModelsSnapshot } from "@/data/frontierModelsSnapshot";
import { FRONTIER_MODELS_BLOB_KEY } from "@/lib/frontierModelsLive";
import { logger } from "@/lib/logger";
import { readSnapshotBlob } from "@/lib/netlifyBlobs";
import type { FrontierModelsSnapshot } from "@/types/frontierModels";

// Serve the blob written by the daily scheduled refresh for up to three
// days. Past that, the committed curated seed is the more honest source —
// a silently dead refresh function must not keep stamping old facts as
// freshly checked.
const BLOB_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;
// One blob read per instance per window. The page itself is served no-store.
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { snapshot: FrontierModelsSnapshot; expiresAt: number } | null =
  null;
let inflight: Promise<FrontierModelsSnapshot> | null = null;

export function resetFrontierModelsCacheForTests(): void {
  cache = null;
  inflight = null;
}

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
// A price or an output limit the provider does not publish is stored as null.
const isNumberOrNull = (value: unknown): boolean => value === null || isNumber(value);

// The blob is whatever some version of the refresh wrote. These are the
// fields the page reads, so a blob from the other side of a schema change
// falls back to the seed instead of breaking the render.
function isServable(value: unknown): value is FrontierModelsSnapshot {
  const blob = (value ?? {}) as Partial<FrontierModelsSnapshot>;
  const { liveFacts } = blob;
  return (
    isDate(blob.generatedAt) &&
    (blob.asOf == null || isDate(blob.asOf)) &&
    (liveFacts == null ||
      (typeof liveFacts.checkedAt === "string" &&
        Array.isArray(liveFacts.sources) &&
        [liveFacts.updated, liveFacts.confirmed, liveFacts.curatedOnly].every(
          isNumber
        ))) &&
    Array.isArray(blob.providers) &&
    blob.providers.every(
      (provider) =>
        typeof provider?.id === "string" &&
        typeof provider.label === "string" &&
        isNumber(provider.count)
    ) &&
    Array.isArray(blob.models) &&
    blob.models.length > 0 &&
    blob.models.every(
      (model) =>
        [
          model?.id,
          model?.name,
          model?.provider,
          model?.providerLabel,
          model?.priceTier,
        ].every((field) => typeof field === "string") &&
        isDate(model.releaseDate) &&
        isNumber(model.contextWindow) &&
        isNumberOrNull(model.maxOutputTokens) &&
        isNumberOrNull(model.inputPricePerMTokens) &&
        isNumberOrNull(model.outputPricePerMTokens) &&
        Array.isArray(model.modalities)
    )
  );
}

export async function getFrontierModelsSnapshot(): Promise<FrontierModelsSnapshot> {
  if (cache && cache.expiresAt > Date.now()) return cache.snapshot;
  if (inflight) return inflight;

  inflight = readSnapshotBlob<FrontierModelsSnapshot>(
    FRONTIER_MODELS_BLOB_KEY,
    BLOB_MAX_AGE_MS
  )
    .then((blob) => {
      // A blob saved before the deployed seed was generated holds an older
      // curation than the seed, even while it is inside its maximum age.
      const isCurrent =
        blob !== null &&
        Date.parse(blob.savedAt) >=
          Date.parse(frontierModelsSnapshot.generatedAt);
      const snapshot =
        isCurrent && isServable(blob.value)
          ? blob.value
          : frontierModelsSnapshot;
      if (isCurrent && snapshot === frontierModelsSnapshot) {
        logger.error(
          "Frontier models blob failed its shape check, serving the seed."
        );
      }
      cache = { snapshot, expiresAt: Date.now() + CACHE_TTL_MS };
      return snapshot;
    })
    .catch(() => frontierModelsSnapshot)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
