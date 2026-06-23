import { renderToStaticMarkup } from "react-dom/server";
import { StructuredData } from "@/components/StructuredData";

function readSchema(markup: string) {
  const match = markup.match(
    /<script type="application\/ld\+json">(.+)<\/script>/
  );

  if (!match) {
    throw new Error("Structured data script was not rendered.");
  }

  return JSON.parse(match[1]) as Record<string, unknown>;
}

describe("StructuredData", () => {
  it("does not invent modification dates for software applications", () => {
    const schema = readSchema(
      renderToStaticMarkup(
        <StructuredData
          type="SoftwareApplication"
          data={{
            name: "Example App",
            author: "Isaac Vazquez",
          }}
        />
      )
    );

    expect(schema.dateModified).toBeUndefined();
    expect(schema.author).toEqual({
      "@type": "Person",
      name: "Isaac Vazquez",
      url: "https://isaacavazquez.com",
    });
  });

  it("preserves explicit dates and normalizes article authors", () => {
    const schema = readSchema(
      renderToStaticMarkup(
        <StructuredData
          type="Article"
          data={{
            headline: "Example Article",
            datePublished: "2026-06-01",
            dateModified: "2026-06-22",
            author: {
              name: "Isaac Vazquez",
              url: "https://isaacavazquez.com/about",
            },
          }}
        />
      )
    );

    expect(schema.dateModified).toBe("2026-06-22");
    expect(schema.author).toEqual({
      "@type": "Person",
      name: "Isaac Vazquez",
      url: "https://isaacavazquez.com/about",
    });
  });
});
