import { isLocalDateKey } from "@/lib/date-formatters";
import {
  isFollowingId,
  isSourceUrl,
  readRecordArray,
} from "@/lib/personalFollowing";

export const FOLLOWED_COMPANIES_KEY = "startup-followed-companies-v1";
export const COMPANY_RESEARCH_KEY = "startup-company-research-v1";
export interface ResearchRound {
  id: string;
  date: string;
  stage: string;
  amount: number | null;
  sourceUrl: string;
}
export interface CompanyResearchRecord {
  id: string;
  notes: string;
  rounds: ResearchRound[];
}
export function parseCompanyResearch(raw: string): CompanyResearchRecord[] {
  const seen = new Set<string>();
  return readRecordArray(raw)
    .flatMap((row): CompanyResearchRecord[] => {
      if (
        !isFollowingId(row.id) ||
        seen.has(row.id) ||
        typeof row.notes !== "string" ||
        row.notes.length > 4000 ||
        !Array.isArray(row.rounds)
      )
        return [];
      const roundIds = new Set<string>();
      const rounds = row.rounds
        .flatMap((r): ResearchRound[] => {
          if (
            !r ||
            !isFollowingId(r.id) ||
            roundIds.has(r.id) ||
            !isLocalDateKey(r.date) ||
            typeof r.stage !== "string" ||
            !r.stage.trim() ||
            r.stage.length > 80 ||
            !isSourceUrl(r.sourceUrl) ||
            !(
              r.amount === null ||
              (typeof r.amount === "number" &&
                Number.isFinite(r.amount) &&
                r.amount >= 0 &&
                r.amount <= 1e12)
            )
          )
            return [];
          roundIds.add(r.id);
          return [
            {
              id: r.id,
              date: r.date,
              stage: r.stage.trim(),
              amount: r.amount,
              sourceUrl: r.sourceUrl,
            },
          ];
        })
        .slice(0, 30);
      seen.add(row.id);
      return [{ id: row.id, notes: row.notes, rounds }];
    })
    .slice(0, 20);
}
export function appendResearchRound(
  latest: CompanyResearchRecord[],
  id: string,
  round: ResearchRound,
) {
  const current = latest.find((item) => item.id === id);
  if (
    !isFollowingId(id) ||
    current?.rounds.some((item) => item.id === round.id) ||
    (current?.rounds.length ?? 0) >= 30 ||
    (!current && latest.length >= 20)
  )
    return latest;
  const record = {
    id,
    notes: current?.notes ?? "",
    rounds: [...(current?.rounds ?? []), round],
  };
  return current
    ? latest.map((item) => (item.id === id ? record : item))
    : [...latest, record];
}
