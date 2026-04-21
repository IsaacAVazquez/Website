import { NextRequest, NextResponse } from "next/server";

const DEPRECATION_MESSAGE =
  "The public fantasy product no longer updates through /api/scheduled-update. Published fantasy snapshots are generated offline with `npm run update:fantasy` and committed by GitHub Actions.";

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      status: "deprecated",
      message: DEPRECATION_MESSAGE,
      sourceOfTruth: "GitHub Actions fantasy snapshot workflow",
      artifacts: [
        "src/data/fantasyPositionData.generated.ts",
        "src/data/fantasySnapshotRevision.generated.ts",
        "public/data/fantasy/ppr.json",
        "public/data/fantasy/half_ppr.json",
        "public/data/fantasy/standard.json",
      ],
    },
    { status: 410 }
  );
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    status: "deprecated",
    message: DEPRECATION_MESSAGE,
    sourceOfTruth: "GitHub Actions fantasy snapshot workflow",
  });
}
