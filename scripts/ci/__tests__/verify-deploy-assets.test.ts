/**
 * @jest-environment node
 */
import { inspectDeployFiles } from "../verify-deploy-assets.mjs";

describe("inspectDeployFiles", () => {
  it("passes a deploy that published the plugin's static output", () => {
    expect(
      inspectDeployFiles([
        "/index.html",
        "/_next/static/css/4f1c0a.css",
        "/_next/static/css/app/layout.css",
        "/_next/static/chunks/main.js",
        "/sitemap.xml",
      ])
    ).toEqual({ ok: true, stylesheets: 2, artifacts: [] });
  });

  it("fails the raw .next tree, which has no stylesheet path and build files at the root", () => {
    // The shape of the 2026-08-20 deploy: the stylesheets sit under /static/css
    // with no /_next prefix, beside the build manifests and the server tree.
    expect(
      inspectDeployFiles([
        "/BUILD_ID",
        "/build-manifest.json",
        "/routes-manifest.json",
        "/server/app/page.js",
        "/static/css/4f1c0a.css",
      ])
    ).toEqual({
      ok: false,
      stylesheets: 0,
      artifacts: ["/BUILD_ID", "/build-manifest.json", "/routes-manifest.json", "/server/app/page.js"],
    });
  });

  it("fails on either half alone", () => {
    // Stylesheets present, but a build artifact leaked to the root.
    expect(
      inspectDeployFiles(["/_next/static/css/a.css", "/required-server-files.json"])
    ).toEqual({ ok: false, stylesheets: 1, artifacts: ["/required-server-files.json"] });
    // No artifacts, but nothing under /_next/static/css either. A .css.map and a
    // stylesheet in another folder do not count.
    expect(
      inspectDeployFiles(["/index.html", "/_next/static/css/a.css.map", "/_next/static/media/a.css"])
    ).toEqual({ ok: false, stylesheets: 0, artifacts: [] });
  });
});
