/**
 * @jest-environment node
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { ECR_BASELINE_MAX_RANK, isUndraftedFloorAdp } from "@/lib/draftAnalytics";

/**
 * ECR_BASELINE_MAX_RANK and the undrafted-ADP floor are both calibrated against a
 * committed snapshot rather than derived from first principles. ADP compresses as
 * more real drafts land through the preseason, so the honest cutoff moves. These
 * tests re-derive the calibration from whatever snapshot is committed and fail when
 * it drifts far enough that the constant is telling a story the data no longer
 * supports. A failure here means re-measure and update the constant, not silence it.
 */

interface SnapshotPlayer {
  adp?: number;
  adpTimesDrafted?: number;
  rankEcr?: number;
  averageRank?: number;
}

function readOverall(file: string): SnapshotPlayer[] {
  const raw = readFileSync(path.join(process.cwd(), "public/data/fantasy", file), "utf8");
  const parsed = JSON.parse(raw) as { overall?: SnapshotPlayer[]; players?: SnapshotPlayer[] };
  return parsed.overall ?? parsed.players ?? [];
}

function meanAbsoluteGap(players: SnapshotPlayer[], maxRank: number): number {
  const paired = players.filter(
    (p) => typeof p.adp === "number" && typeof p.rankEcr === "number" && p.rankEcr <= maxRank
  );
  const total = paired.reduce(
    (sum, p) => sum + Math.abs((p.rankEcr as number) - (p.adp as number)),
    0
  );
  return total / Math.max(1, paired.length);
}

describe("ADP baseline calibration", () => {
  const redraft = readOverall("ppr.json");

  it("keeps consensus rank close enough to ADP below the cutoff to stand in for a pick", () => {
    const gap = meanAbsoluteGap(redraft, ECR_BASELINE_MAX_RANK);
    // Measured at 11.5 on the 2026-08-06 snapshot. A large move means the two scales
    // have decoupled and the cutoff needs re-measuring.
    expect(gap).toBeLessThan(20);
  });

  it("keeps consensus rank meaningfully worse than ADP above the cutoff", () => {
    // This is the whole reason the cutoff exists. If it ever stops holding, the
    // fallback could safely extend deeper and the cutoff should be revisited.
    const band = redraft.filter(
      (p) =>
        typeof p.adp === "number" &&
        typeof p.rankEcr === "number" &&
        p.rankEcr > ECR_BASELINE_MAX_RANK
    );
    expect(band.length).toBeGreaterThan(0);
    const meanEcr = band.reduce((s, p) => s + (p.rankEcr as number), 0) / band.length;
    const meanAdp = band.reduce((s, p) => s + (p.adp as number), 0) / band.length;
    expect(meanEcr - meanAdp).toBeGreaterThan(15);
  });

  it("keeps every deep redraft ADP an observed price rather than a placeholder", () => {
    // The redraft feed reports real draft results, so a late ADP can drift past the
    // numeric floor as preseason drafts deepen — that is a valid price the floor rule
    // deliberately ignores in redraft mode. The placeholder signature is different:
    // a pile-up of floor values with no sampling evidence (117 of 340 priced best
    // ball players on 2026-08-16, none with a draft count). Fail on that shape only.
    const flagged = redraft.filter(
      (p) => typeof p.adp === "number" && isUndraftedFloorAdp(p.adp, 16, 12)
    );
    for (const player of flagged) {
      expect(player.adpTimesDrafted ?? 0).toBeGreaterThan(0);
    }
    const priced = redraft.filter((p) => typeof p.adp === "number");
    expect(flagged.length).toBeLessThan(Math.max(1, priced.length * 0.05));
  });

  it("still finds the undrafted-ADP pile-up in the best ball snapshot", () => {
    // The best ball feed does floor, which is why the rule exists at all.
    const bestBall = readOverall("best-ball.json");
    const priced = bestBall.filter((p) => typeof p.adp === "number");
    const atFloor = priced.filter((p) => isUndraftedFloorAdp(p.adp as number, 18, 12));
    expect(priced.length).toBeGreaterThan(0);
    expect(atFloor.length).toBeGreaterThan(0);
  });
});
