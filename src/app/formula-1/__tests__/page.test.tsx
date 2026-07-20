import { render, screen } from "@testing-library/react";
import type { Formula1RouteState, Formula1Snapshot } from "@/types/formula1";
import Formula1Page, { metadata } from "../page";

type Formula1ClientProps = {
  initialState: Formula1RouteState;
  snapshot: Formula1Snapshot;
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

  it("declares the canonical Formula 1 route metadata", () => {
    expect(metadata.alternates?.canonical).toBe("/formula-1");
    expect(metadata.title).toEqual({
      absolute: "Formula 1 Pulse | Isaac Vazquez Portfolio",
    });
    expect(metadata.description).toMatch(/Formula 1 dashboard/i);
  });
});
