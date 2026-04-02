import { render, screen } from "@testing-library/react";
import { DataFreshnessIndicator } from "../DataFreshnessIndicator";

describe("DataFreshnessIndicator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-02T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows an explicit snapshot date for stale dataset timestamps", () => {
    render(
      <DataFreshnessIndicator
        lastUpdated="2026-03-07T08:09:58.760793+00:00"
        mode="dataset"
      />
    );

    expect(screen.getByText("Snapshot as of Mar 7, 2026")).toBeInTheDocument();
  });

  it("keeps relative freshness copy for recent live timestamps", () => {
    render(
      <DataFreshnessIndicator
        lastUpdated="2026-04-02T11:30:00.000Z"
        mode="live"
      />
    );

    expect(screen.getByText("Live snapshot fetched 30m ago")).toBeInTheDocument();
  });
});
