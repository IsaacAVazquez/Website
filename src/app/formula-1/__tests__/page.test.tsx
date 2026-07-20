import { render, screen } from "@testing-library/react";
import type {
  Formula1MeetingSummary,
  Formula1RouteState,
  Formula1Summary,
} from "@/types/formula1";
import Formula1Page, { metadata } from "../page";

type Formula1ClientProps = {
  initialState: Formula1RouteState;
  summary: Formula1Summary;
  initialMeeting: Formula1MeetingSummary | null;
};

const mockFormula1Client = jest.fn<void, [Formula1ClientProps]>();

jest.mock("../formula-1-client", () => ({
  Formula1Client: (props: Formula1ClientProps) => {
    mockFormula1Client(props);
    return <div data-testid="formula1-client" />;
  },
}));

describe("Formula1Page", () => {
  beforeEach(() => {
    mockFormula1Client.mockReset();
  });

  it("awaits promised search params and seeds the client shell", async () => {
    const page = await Formula1Page({
      searchParams: Promise.resolve({
        view: "drivers",
        meeting: "1281",
      }),
    });

    render(page);

    expect(screen.getByTestId("formula1-client")).toBeVisible();
    expect(mockFormula1Client).toHaveBeenCalledWith(
      expect.objectContaining({
        initialState: {
          view: "drivers",
          meeting: "1281",
        },
      })
    );
  });

  it("passes a slim summary without per-meeting results plus the seeded meeting detail", async () => {
    const page = await Formula1Page({
      searchParams: Promise.resolve({}),
    });

    render(page);

    const props = mockFormula1Client.mock.calls.at(-1)?.[0];
    expect(props).toBeDefined();
    expect(props!.summary.meetings.length).toBeGreaterThan(0);
    for (const meeting of props!.summary.meetings) {
      expect(meeting).not.toHaveProperty("classification");
      expect(meeting).not.toHaveProperty("podium");
    }

    // The resolved default meeting ships as full detail so first paint needs
    // no client fetch.
    expect(props!.initialMeeting).not.toBeNull();
    expect(Array.isArray(props!.initialMeeting!.classification)).toBe(true);
    expect(props!.initialMeeting!.key).toBe(
      props!.summary.defaultMeetingKey ?? props!.summary.meetings[0]!.key
    );
  });

  it("declares the canonical Formula 1 route metadata", () => {
    expect(metadata.alternates?.canonical).toBe("/formula-1");
    expect(metadata.title).toEqual({
      absolute: "Formula 1 Pulse | Isaac Vazquez",
    });
    expect(metadata.description).toMatch(/Formula 1 dashboard/i);
  });
});
