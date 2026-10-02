import { cn } from "../cn";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("drops false, undefined, and null", () => {
    const condition = false;
    expect(cn("class1", condition && "class2", undefined, null, "class3")).toBe("class1 class3");
  });
});
