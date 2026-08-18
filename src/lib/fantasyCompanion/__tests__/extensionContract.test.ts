import { readFileSync } from "node:fs";
import path from "node:path";

interface ExtensionManifest {
  manifest_version?: number;
  permissions?: string[];
  host_permissions?: string[];
  content_scripts?: unknown[];
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
    expect(manifest.permissions).toEqual(["storage", "sidePanel"]);
    expect(manifest.side_panel?.default_path).toBe("sidepanel.html");
    expect(manifest.background).toEqual({
      service_worker: "service-worker.js",
      type: "module",
    });
  });

  it("can refresh published rankings without reading draft websites", () => {
    const manifest = readManifest();
    const serialized = JSON.stringify(manifest).toLowerCase();

    expect(manifest.host_permissions).toEqual(["https://isaacvazquez.com/*"]);
    expect(manifest.content_scripts).toBeUndefined();
    expect(serialized).not.toContain("espn");
    expect(serialized).not.toContain("underdog");
    expect(manifest.permissions).not.toEqual(
      expect.arrayContaining(["activeTab", "scripting", "tabs", "webRequest"])
    );
  });
});
