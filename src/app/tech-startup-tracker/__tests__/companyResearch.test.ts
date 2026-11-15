import { parseCompanyResearch, appendResearchRound } from "../companyResearch";

const round = {
  id: "round",
  date: "2026-10-20",
  stage: "Series B",
  amount: null,
  sourceUrl: "https://example.com/announcement",
};
it("keeps an undisclosed funding amount unknown and rejects impossible dates and unsafe sources", () => {
  const saved = { id: "company", notes: "Research", rounds: [round] };
  expect(parseCompanyResearch(JSON.stringify([saved]))).toEqual([saved]);
  expect(
    parseCompanyResearch(
      JSON.stringify([
        {
          ...saved,
          rounds: [
            { ...round, date: "2026-02-30" },
            { ...round, sourceUrl: "javascript:alert(1)" },
          ],
        },
      ]),
    )[0].rounds,
  ).toEqual([]);
});
it("adds a round to the latest notes and avoids duplicate ids", () => {
  const latest = [
    { id: "company", notes: "Edited in another tab", rounds: [] },
  ];
  const saved = appendResearchRound(latest, "company", round);
  expect(saved[0].notes).toBe("Edited in another tab");
  expect(saved[0].rounds).toEqual([round]);
  expect(appendResearchRound(saved, "company", round)).toBe(saved);
});
