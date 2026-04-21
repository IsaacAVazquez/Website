import { metadata } from "../page";

describe("Golf metadata", () => {
  it("uses the route-specific open graph image", () => {
    const openGraph = metadata.openGraph as { images: Array<{ url: string }> };
    const twitter = metadata.twitter as { images: string[] };

    expect(openGraph.images[0].url).toBe("https://isaacavazquez.com/golf/opengraph-image");
    expect(twitter.images[0]).toBe("https://isaacavazquez.com/golf/opengraph-image");
  });
});
