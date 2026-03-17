/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/investmentsData", () => ({
  getInvestmentsIndex: jest.fn(),
}));

import { GET } from "../route";
import { getInvestmentsIndex } from "@/lib/investmentsData";

const mockGetInvestmentsIndex = getInvestmentsIndex as jest.MockedFunction<
  typeof getInvestmentsIndex
>;

describe("GET /api/investments/index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes the request origin to the prefetched index loader", async () => {
    mockGetInvestmentsIndex.mockResolvedValue({
      symbols: ["AAPL", "MSFT"],
      failed: [],
      lastUpdated: "2026-03-16T08:00:00.000Z",
    });

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/investments/index")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.symbols).toEqual(["AAPL", "MSFT"]);
    expect(mockGetInvestmentsIndex).toHaveBeenCalledWith({
      assetOrigin: "https://isaacavazquez.com",
    });
  });

  it("returns a dataset-specific 503 when the curated index is unavailable", async () => {
    mockGetInvestmentsIndex.mockRejectedValue(
      Object.assign(new Error("Curated investments dataset is temporarily unavailable."), {
        status: 503,
      })
    );

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/investments/index")
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/curated investments dataset/i);
    expect(body.symbols).toEqual([]);
  });
});
