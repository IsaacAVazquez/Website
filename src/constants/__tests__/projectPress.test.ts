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

it("prints every fantasy route in green and saffron", () => {
  const fs = jest.requireActual<typeof import("node:fs")>("node:fs");
  const path = jest.requireActual<typeof import("node:path")>("node:path");
  const root = path.join(process.cwd(), "src/app/fantasy-football");
  const routes = (fs.readdirSync(root, { recursive: true }) as string[])
    .filter((file) => file.endsWith(`${path.sep}page.tsx`) || file === "page.tsx")
    .map((file) => `/fantasy-football${file === "page.tsx" ? "" : `/${path.dirname(file).split(path.sep).join("/")}`}`)
    .sort();
  expect(routes).toHaveLength(8);
  for (const route of routes) {
    expect({ route, press: getProjectPress(route) }).toEqual({ route, press: { lead: "green", second: "saffron" } });
  }
});
