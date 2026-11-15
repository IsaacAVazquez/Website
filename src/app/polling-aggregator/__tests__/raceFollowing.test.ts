import {
  raceReading,
  compareRaceReading,
  parseRaceReadings,
} from "../raceFollowing";
import type { Race } from "@/types/polling";

const race = {
  id: "senate-mi",
  year: 2026,
  candidates: [
    { name: "A", support: 49 },
    { name: "B", support: 47 },
  ],
  lastPolled: "2026-10-20",
  polls: [{ id: "one" }],
} as Race;
it("compares named candidates even when the lead changes", () => {
  const before = raceReading(race, "2026-10-21T00:00:00Z");
  const now = raceReading(
    {
      ...race,
      candidates: [
        { name: "B", support: 50 },
        { name: "A", support: 48 },
      ],
      polls: [{ id: "one" }, { id: "two" }] as Race["polls"],
    },
    "2026-10-25T00:00:00Z",
  );
  expect(compareRaceReading(now, before)).toEqual({
    candidate: "B",
    marginChange: 4,
    newPolls: 1,
  });
  expect(compareRaceReading({ ...now, year: 2028 }, before)).toBeNull();
  expect(
    compareRaceReading(
      {
        ...now,
        candidates: [
          { name: "C", support: 50 },
          { name: "A", support: 48 },
        ],
      },
      before,
    ),
  ).toBeNull();
});
it("rejects malformed history and bounded candidate support", () => {
  const saved = raceReading(race, "2026-10-21T00:00:00Z");
  expect(
    parseRaceReadings(
      JSON.stringify([
        saved,
        {
          ...saved,
          candidates: [
            { name: "A", support: 101 },
            { name: "B", support: 47 },
          ],
        },
      ]),
    ),
  ).toEqual([saved]);
});
