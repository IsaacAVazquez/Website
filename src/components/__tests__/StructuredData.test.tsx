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
      "@id": "https://isaacvazquez.com/about#person",
      name: "Isaac Vazquez",
      url: "https://isaacvazquez.com/about",
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
              url: "https://isaacvazquez.com/about",
            },
          }}
        />
      )
    );

    expect(schema.dateModified).toBe("2026-06-22");
    expect(schema.author).toEqual({
      "@type": "Person",
      "@id": "https://isaacvazquez.com/about#person",
      name: "Isaac Vazquez",
      url: "https://isaacvazquez.com/about",
    });
  });

  it("models Haas as current education and names no current employer", () => {
    const schema = readSchema(
      renderToStaticMarkup(<StructuredData type="Person" />)
    );

    expect(schema["@id"]).toBe(
      "https://isaacvazquez.com/about#person"
    );
    expect(schema).toEqual(
      expect.objectContaining({
        name: "Isaac Vazquez",
        givenName: "Isaac",
        familyName: "Vazquez",
        alternateName: ["IsaacAVazquez"],
        image: "https://isaacvazquez.com/images/headshot-home.webp",
      })
    );
    // x.com/isaacvazquez returned "User Profile Not Found" on 2026-09-24, so the
    // entity links only profiles a crawler can open.
    expect(schema.sameAs).toEqual([
      "https://github.com/IsaacAVazquez",
      "https://www.linkedin.com/in/isaac-vazquez/",
    ]);
    expect(schema.disambiguatingDescription).toContain(
      "UC Berkeley Haas MBA candidate"
    );
    // Haas@Work ended in May 2026 (Isaac, 2026-09-29) and no job has followed,
    // so the entity names no employer.
    expect(schema.worksFor).toBeUndefined();
    expect(schema.affiliation).toEqual(
      expect.objectContaining({
        "@type": "CollegeOrUniversity",
        name: "UC Berkeley Haas School of Business",
      })
    );
    expect(schema.alumniOf).toEqual([
      expect.objectContaining({ name: "Florida State University" }),
    ]);
    // Isaac is an MBA candidate moving into product, not a product manager
    // (his correction on 2026-09-28), so the entity claims no occupation.
    expect(schema.jobTitle).toBe("UC Berkeley Haas MBA Candidate");
    expect(schema.hasOccupation).toBeUndefined();
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
        url: "https://www.fsu.edu/",
      },
    ]);
  });

  it("maps a WebPage title to name without leaking a nonstandard title key", () => {
    const schema = readSchema(
      renderToStaticMarkup(
        <StructuredData
          type="WebPage"
          data={{ title: "Accessibility Statement", url: "https://isaacvazquez.com/accessibility" }}
        />
      )
    );

    expect(schema.name).toBe("Accessibility Statement");
    expect(schema.title).toBeUndefined();
  });

  it("does not leak the nonstandard items key on BreadcrumbList", () => {
    const schema = readSchema(
      renderToStaticMarkup(
        <StructuredData
          type="BreadcrumbList"
          data={{
            items: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://isaacvazquez.com" },
            ],
          }}
        />
      )
    );

    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toBeDefined();
    expect(schema.items).toBeUndefined();
  });

  it("does not leak the nonstandard questions key on FAQPage", () => {
    const schema = readSchema(
      renderToStaticMarkup(
        <StructuredData
          type="FAQPage"
          data={{
            questions: [
              {
                "@type": "Question",
                name: "How often do rankings refresh?",
                acceptedAnswer: { "@type": "Answer", text: "Daily." },
              },
            ],
          }}
        />
      )
    );

    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toBeDefined();
    expect(schema.questions).toBeUndefined();
  });

  it("does not leak Fantasy Football defaults into SportsApplication without explicit inputs", () => {
    const schema = readSchema(
      renderToStaticMarkup(
        <StructuredData
          type="SportsApplication"
          data={{
            name: "PGA Tour Pulse",
            description: "Golf leaderboard dashboard",
            url: "https://isaacvazquez.com/golf",
            applicationCategory: "SportsApplication",
          }}
        />
      )
    );

    expect(schema.name).toBe("PGA Tour Pulse");
    expect(schema.about).toBeUndefined();
    expect(schema.audience).toBeUndefined();
    expect(schema.featureList).toBeUndefined();
    expect(schema.offers).toBeUndefined();
  });

  it("emits valid schema.org Dataset structure with default license and free access", () => {
    const schema = readSchema(
      renderToStaticMarkup(
        <StructuredData
          type="Dataset"
          data={{
            name: "Global Earthquake Activity Dataset",
            description: "24-hour seismic events and magnitude distribution.",
            url: "https://isaacvazquez.com/earthquake-pulse",
            keywords: ["earthquakes", "seismic data"],
            dateModified: "2026-10-02",
          }}
        />
      )
    );

    expect(schema["@type"]).toBe("Dataset");
    expect(schema.name).toBe("Global Earthquake Activity Dataset");
    expect(schema.isAccessibleForFree).toBe(true);
    expect(schema.license).toBe("https://creativecommons.org/publicdomain/zero/1.0/");
    expect(schema.creator).toEqual({
      "@type": "Person",
      "@id": "https://isaacvazquez.com/about#person",
      "name": "Isaac Vazquez",
      "url": "https://isaacvazquez.com/about",
    });
    expect(schema.dateModified).toBe("2026-10-02");
  });
});
