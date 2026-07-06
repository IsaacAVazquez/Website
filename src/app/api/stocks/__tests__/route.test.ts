/**
 * @jest-environment node
 */
import { GET } from "../route";

describe("/api/stocks (retired)", () => {
  it("returns 410 Gone with deprecation headers pointing to the successor route", () => {
    const response = GET();

    expect(response.status).toBe(410);
    expect(response.headers.get("Deprecation")).toBe("true");
    expect(response.headers.get("Sunset")).toBeTruthy();
    expect(response.headers.get("Link")).toContain("/api/investments/quotes");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
