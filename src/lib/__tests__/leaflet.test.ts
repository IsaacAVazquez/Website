import { loadLeaflet } from "../leaflet";

describe("loadLeaflet", () => {
  it("pins the CDN stylesheet and script to a hash the browser checks", () => {
    // The script never loads under jsdom, so the promise stays pending.
    void loadLeaflet();

    const link = document.head.querySelector("link[data-leaflet]");
    const script = document.head.querySelector('script[src*="leaflet@1.9.4"]');
    for (const element of [link, script]) {
      expect(element?.getAttribute("integrity")).toMatch(/^sha384-[A-Za-z0-9+/]{64}$/);
      // Integrity is only checked on a CORS request.
      expect(element?.getAttribute("crossorigin")).toBe("");
    }
  });
});
