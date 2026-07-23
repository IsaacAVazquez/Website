import {
  normalizeArticleBody,
  reviewBlogDateChange,
} from "../blogDateReview";

function article(
  body: string,
  updatedAt?: string,
  extraFrontmatter = ""
): string {
  return `---
title: "Example"
publishedAt: "2026-01-01"
${updatedAt ? `updatedAt: "${updatedAt}"` : ""}
${extraFrontmatter}
---

${body}
`;
}

describe("blog date review", () => {
  it("ignores line wrapping and whitespace-only body changes", () => {
    const before = article("A sentence split across\nmultiple lines.");
    const after = article("A sentence split across multiple lines.");

    expect(normalizeArticleBody(before)).toBe(normalizeArticleBody(after));
    expect(reviewBlogDateChange(before, after)).toMatchObject({
      bodyChanged: false,
      dateReviewed: true,
    });
  });

  it("does not require updatedAt for frontmatter-only image changes", () => {
    const before = article("The article body.");
    const after = article(
      "The article body.",
      undefined,
      'coverImage: "/images/example.jpg"'
    );

    expect(reviewBlogDateChange(before, after)).toMatchObject({
      bodyChanged: false,
      dateReviewed: true,
    });
  });

  it("flags changed article text without updatedAt", () => {
    const before = article("The original article body.");
    const after = article("The revised article body.");

    expect(reviewBlogDateChange(before, after)).toMatchObject({
      bodyChanged: true,
      dateReviewed: false,
      currentUpdatedAt: null,
    });
  });

  it("flags changed article text when an old updatedAt is left unchanged", () => {
    const before = article("The original article body.", "2026-02-01");
    const after = article("The revised article body.", "2026-02-01");

    expect(reviewBlogDateChange(before, after)).toMatchObject({
      bodyChanged: true,
      dateReviewed: false,
    });
  });

  it("accepts changed article text when updatedAt is reviewed", () => {
    const before = article("The original article body.", "2026-02-01");
    const after = article("The revised article body.", "2026-07-23");

    expect(reviewBlogDateChange(before, after)).toMatchObject({
      bodyChanged: true,
      dateReviewed: true,
      previousUpdatedAt: "2026-02-01",
      currentUpdatedAt: "2026-07-23",
    });
  });
});
