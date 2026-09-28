import { fireEvent, render, waitFor } from "@testing-library/react";

import { MissionImageFrame } from "../MissionImageFrame";

describe("MissionImageFrame", () => {
  // The frame is 220px tall. The hero image in the snapshot is 660 KB at
  // 4096 by 2304, and the largest is 2.6 MB, and a plain img sent each of
  // them whole.
  it("asks the image optimizer for an image stored with the site", () => {
    const { container } = render(
      <MissionImageFrame
        name="Starship"
        image="/data/spacex/images/abc123.jpg"
        alt="Starship vehicle view"
      />
    );
    const image = container.querySelector("img");

    expect(image?.getAttribute("src")).toContain(
      "/_next/image?url=%2Fdata%2Fspacex%2Fimages%2Fabc123.jpg"
    );
    expect(image?.getAttribute("sizes")).toBeTruthy();
    expect(image).toHaveAttribute("alt", "Starship vehicle view");
  });

  // Launch Library's hosts are not in next.config's remotePatterns, so the
  // optimizer would refuse them. next/image writes a protocol-relative source
  // out with the page's protocol, which is where the browser would send it.
  it.each(["https://example.com/rocket.jpg", "//example.com/rocket.jpg"])(
    "loads %s from its own host",
    (source) => {
      const { container } = render(
        <MissionImageFrame name="Falcon 9" image={source} alt="Falcon 9 vehicle view" />
      );
      const rendered = container.querySelector("img")?.getAttribute("src") ?? "";

      expect(rendered).toMatch(/^https?:\/\/example\.com\/rocket\.jpg$/);
      expect(rendered).not.toContain("/_next/image");
    }
  );

  it("moves to the fallback image when the first one fails", () => {
    const { container } = render(
      <MissionImageFrame
        name="Falcon 9"
        image="https://example.com/missing.jpg"
        fallbackImage="https://example.com/fallback.jpg"
        alt="Falcon 9 vehicle view"
        dataTestId="frame"
      />
    );
    const image = container.querySelector("img") as HTMLImageElement;

    fireEvent.error(image);

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.com/fallback.jpg"
    );
    expect(container.querySelector('[data-testid="frame"]')).toHaveAttribute(
      "data-image-state",
      "loading"
    );
  });

  // next/image waits for the image to decode before it reports the load.
  it("marks the frame loaded once the image arrives", async () => {
    const { container } = render(
      <MissionImageFrame
        name="Falcon 9"
        image="https://example.com/rocket.jpg"
        alt="Falcon 9 vehicle view"
        dataTestId="frame"
      />
    );

    fireEvent.load(container.querySelector("img") as HTMLImageElement);

    await waitFor(() =>
      expect(container.querySelector('[data-testid="frame"]')).toHaveAttribute(
        "data-image-state",
        "loaded"
      )
    );
  });
});
