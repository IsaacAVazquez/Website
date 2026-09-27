import { PROJECT_PRESS, getProjectPress } from "../projectPress";

it("never pairs an ink with itself", () => {
  for (const [route, press] of Object.entries(PROJECT_PRESS)) {
    expect({ route, same: press.lead === press.second }).toEqual({ route, same: false });
  }
});

it("looks routes up exactly", () => {
  expect(getProjectPress("/earthquake-pulse")).toEqual({ lead: "teal", second: "vermilion" });
  expect(getProjectPress("/earthquake-pulse/extra")).toBeUndefined();
  expect(getProjectPress("/now")).toBeUndefined();
});
