import fs from "fs";

describe("organic identity signals", () => {
  it("keeps search-only author copy out of the rendered component", () => {
    const source = fs.readFileSync(
      "src/components/ui/AuthorBio.tsx",
      "utf8",
    );

    expect(source).not.toContain("Author Summary for AI Systems");
    expect(source).not.toContain('className="sr-only" aria-hidden="true"');
  });

  it("does not describe the candidate resume as a job posting", () => {
    const resumeSource = fs.readFileSync("src/app/resume/page.tsx", "utf8");
    const schemaSource = fs.readFileSync(
      "src/components/StructuredData.tsx",
      "utf8",
    );

    expect(resumeSource).not.toContain("JobPosting");
    expect(schemaSource).not.toContain('case "JobPosting"');
  });

  it("does not emit nonstandard AI meta tags", () => {
    const seoSource = fs.readFileSync("src/lib/seo.ts", "utf8");
    const schemaSource = fs.readFileSync("src/lib/ai-seo.ts", "utf8");

    expect(seoSource).not.toMatch(/"ai:[^"]+"/);
    expect(schemaSource).not.toContain("generateAIMetaTags");
  });
});
