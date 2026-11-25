jest.mock("next/og", () => ({ ImageResponse: class {} }));

import { clip } from "../og";

describe("clip", () => {
  it("leaves text within the limit alone", () => {
    expect(clip("Short excerpt.", 20)).toBe("Short excerpt.");
  });

  it("cuts at the last word boundary inside the limit", () => {
    expect(clip("one two three four", 10)).toBe("one two…");
    expect(clip("one two, three four", 9)).toBe("one two…");
  });

  // lastIndexOf returns -1 here, which used to keep all but the last character.
  it("cuts at the limit when no space falls inside it", () => {
    expect(clip("abcdefghijklmnop", 10)).toBe("abcdefghij…");
    expect(clip("abcdefghijklmnop qrs", 10)).toBe("abcdefghij…");
  });
});
