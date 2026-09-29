/**
 * @jest-environment node
 */
import { GET } from "../route";

describe("GET /teapot", () => {
  it("answers 418 with a plain text note", async () => {
    const response = GET();

    expect(response.status).toBe(418);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    const body = await response.text();
    expect(body.startsWith("418 I'm a teapot\n")).toBe(true);
    expect(body).toContain("RFC 2324");
  });
});
