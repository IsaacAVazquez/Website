import { NextResponse } from "next/server";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET() {
  return NextResponse.json(laLigaSnapshot, { headers: CACHE_HEADERS });
}
