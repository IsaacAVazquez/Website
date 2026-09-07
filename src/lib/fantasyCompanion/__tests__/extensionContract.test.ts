import { readFileSync } from "node:fs";
import path from "node:path";

interface ExtensionManifest {
  manifest_version?: number;
  permissions?: string[];
  host_permissions?: string[];
  content_scripts?: Array<{ matches?: string[]; js?: string[] }>;
  side_panel?: { default_path?: string };
  background?: { service_worker?: string; type?: string };
}

const projectRoot = path.resolve(__dirname, "../../../..");

function readManifest(): ExtensionManifest {
  return JSON.parse(
    readFileSync(path.join(projectRoot, "extension/public/manifest.json"), "utf8")
  ) as ExtensionManifest;
}

describe("fantasy companion extension contract", () => {
  it("uses a Manifest V3 side panel with browser-local storage", () => {
    const manifest = readManifest();

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toEqual(["activeTab", "storage", "sidePanel"]);
    expect(manifest.side_panel?.default_path).toBe("sidepanel.html");
    expect(manifest.background).toEqual({
      service_worker: "service-worker.js",
      type: "module",
    });
  });

  it("limits provider access to draft hosts and Sleeper's read-only API", () => {
    const manifest = readManifest();

    expect(manifest.host_permissions).toEqual([
      "https://isaacvazquez.com/*",
      "https://fantasy.espn.com/*",
      "https://sleeper.com/*",
      "https://*.sleeper.com/*",
      "https://api.sleeper.app/*",
      "https://app.underdogsports.com/*",
    ]);
    expect(manifest.content_scripts).toEqual([
      expect.objectContaining({
        matches: [
          "https://fantasy.espn.com/*",
          "https://sleeper.com/*",
          "https://*.sleeper.com/*",
          "https://app.underdogsports.com/*",
        ],
        js: ["autodraft-content.js"],
      }),
    ]);
    expect(manifest.permissions).not.toEqual(
      expect.arrayContaining(["scripting", "tabs", "webRequest"])
    );
  });
});
