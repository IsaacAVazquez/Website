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
      "@id": "https://isaacavazquez.com/about#person",
      name: "Isaac Vazquez",
      url: "https://isaacavazquez.com/about",
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
      "@id": "https://isaacavazquez.com/about#person",
      name: "Isaac Vazquez",
      url: "https://isaacavazquez.com/about",
    });
  });

  it("models Haas as current education and Haas@Work as the current role", () => {
    const schema = readSchema(
      renderToStaticMarkup(<StructuredData type="Person" />)
    );

    expect(schema["@id"]).toBe(
      "https://isaacavazquez.com/about#person"
    );
    expect(schema.worksFor).toEqual(
      expect.objectContaining({ name: "Haas@Work" })
    );
    expect(schema.affiliation).toEqual(
      expect.objectContaining({
        "@type": "CollegeOrUniversity",
        name: "UC Berkeley Haas School of Business",
      })
    );
    expect(schema.alumniOf).toEqual([
      expect.objectContaining({ name: "Florida State University" }),
    ]);
    expect(schema.hasOccupation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "Occupation",
          name: "Product Manager",
        }),
      ])
    );
    expect(JSON.stringify(schema)).not.toContain('"worksFor":{"@type":"Organization","name":"Civitech"');
  });

  it("emits only schema.org-valid fields on education entities", () => {
    const schema = readSchema(
      renderToStaticMarkup(<StructuredData type="Person" />)
    );
    const serialized = JSON.stringify(schema);

    // The profile's education entries carry degree/startDate/endDate for
    // other surfaces; none of those are valid CollegeOrUniversity properties.
    expect(serialized).not.toContain('"degree"');
    expect(schema.alumniOf).toEqual([
      {
        "@type": "CollegeOrUniversity",
        name: "Florida State University",
        description:
          "Bachelor of Arts - Political Science and International Affairs",
      },
    ]);
  });

  it("maps a WebPage title to name without leaking a nonstandard title key", () => {
    const schema = readSchema(
      renderToStaticMarkup(
        <StructuredData
          type="WebPage"
          data={{ title: "Accessibility Statement", url: "https://isaacavazquez.com/accessibility" }}
        />
      )
    );

    expect(schema.name).toBe("Accessibility Statement");
    expect(schema.title).toBeUndefined();
  });
});
