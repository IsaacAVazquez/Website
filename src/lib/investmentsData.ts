import { promises as fs } from "fs";
import path from "path";
import type { InvestmentsIndex } from "@/types/investment";
import { normalizeInvestmentsIndex } from "@/lib/investmentsIndex";
import { getInvestmentsAssetOrigin } from "@/lib/investmentsAssetOrigin";

type PrefetchedReadStatus = "hit" | "missing" | "skipped";

interface PrefetchedReadResult<T> {
  data: T | null;
  source: "filesystem" | "public" | null;
  diagnostics: {
    relativePath: string;
    assetOrigin: string | null;
    filesystem: PrefetchedReadStatus;
    publicAsset: PrefetchedReadStatus;
    publicStatus?: number;
  };
}

interface InvestmentsDataOptions {
  assetOrigin?: string | null;
}

const DATA_DIR = path.join(process.cwd(), "public", "data", "investments");
const INDEX_TTL_MS = 5 * 60 * 1000;

let indexCache:
  | {
      data: InvestmentsIndex;
      expiresAt: number;
    }
  | null = null;

function createCuratedDatasetUnavailableError() {
  return Object.assign(
    new Error("Curated investments dataset is temporarily unavailable."),
    {
      status: 503,
      source: "prefetched" as const,
      capabilities: {},
      lastUpdated: null,
    }
  );
}

async function readJsonFile<T>(
  filePath: string
): Promise<{ data: T | null; status: PrefetchedReadStatus }> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return {
      data: JSON.parse(raw) as T,
      status: "hit",
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return {
        data: null,
        status: "missing",
      };
    }
    throw error;
  }
}

async function fetchPublicJsonFile<T>(
  relativePath: string,
  options: InvestmentsDataOptions = {}
): Promise<{
  data: T | null;
  status: PrefetchedReadStatus;
  httpStatus?: number;
}> {
  const origin = getInvestmentsAssetOrigin(options);
  if (!origin) {
    return {
      data: null,
      status: "skipped",
    };
  }

  try {
    const response = await fetch(
      new URL(`/data/investments/${relativePath}`, origin).toString(),
      { cache: "force-cache" }
    );

    if (!response.ok) {
      return {
        data: null,
        status: "missing",
        httpStatus: response.status,
      };
    }

    return {
      data: (await response.json()) as T,
      status: "hit",
      httpStatus: response.status,
    };
  } catch {
    return {
      data: null,
      status: "missing",
    };
  }
}

async function readInvestmentJson<T>(
  relativePath: string,
  options: InvestmentsDataOptions = {}
): Promise<PrefetchedReadResult<T>> {
  const localFile = await readJsonFile<T>(path.join(DATA_DIR, relativePath));
  if (localFile.data !== null) {
    return {
      data: localFile.data,
      source: "filesystem",
      diagnostics: {
        relativePath,
        assetOrigin: getInvestmentsAssetOrigin(options),
        filesystem: localFile.status,
        publicAsset: "skipped",
      },
    };
  }

  const publicFile = await fetchPublicJsonFile<T>(relativePath, options);
  return {
    data: publicFile.data,
    source: publicFile.data !== null ? "public" : null,
    diagnostics: {
      relativePath,
      assetOrigin: getInvestmentsAssetOrigin(options),
      filesystem: localFile.status,
      publicAsset: publicFile.status,
      publicStatus: publicFile.httpStatus,
    },
  };
}

function logPrefetchedDatasetResolutionFailure(
  result: PrefetchedReadResult<unknown>
): void {
  console.error("Prefetched investments dataset resolution failed:", {
    path: result.diagnostics.relativePath,
    assetOrigin: result.diagnostics.assetOrigin,
    filesystem: result.diagnostics.filesystem,
    publicAsset: result.diagnostics.publicAsset,
    publicStatus: result.diagnostics.publicStatus,
  });
}

async function ensurePrefetchedJson<T>(
  relativePath: string,
  options: InvestmentsDataOptions = {}
): Promise<T> {
  const result = await readInvestmentJson<T>(relativePath, options);
  if (result.data !== null) {
    return result.data;
  }

  logPrefetchedDatasetResolutionFailure(result);
  throw createCuratedDatasetUnavailableError();
}

export async function getInvestmentsIndex(
  options: InvestmentsDataOptions = {}
): Promise<InvestmentsIndex> {
  if (indexCache && indexCache.expiresAt > Date.now()) {
    return indexCache.data;
  }

  const rawIndex = await ensurePrefetchedJson<InvestmentsIndex>("index.json", options);
  const data = normalizeInvestmentsIndex(rawIndex);
  indexCache = {
    data,
    expiresAt: Date.now() + INDEX_TTL_MS,
  };

  return data;
}

}
