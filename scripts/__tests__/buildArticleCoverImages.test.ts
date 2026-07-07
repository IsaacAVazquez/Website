/**
 * @jest-environment node
 */
import os from "os";
import path from "path";
import { promises as fs } from "fs";

import {
  applyCoverFrontmatter,
  buildArticleCoverImages,
} from "../buildArticleCoverImages";

const THUMB_URL = "https://upload.wikimedia.org/thumb/example/1600px-example.jpg";

function commonsSearchResponse(overrides: Record<string, unknown> = {}): Response {
  const body = {
    query: {
      pages: {
        "42": {
          index: 1,
          title: "File:Example.jpg",
          imageinfo: [
            {
              thumburl: THUMB_URL,
              descriptionurl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
              mime: "image/jpeg",
              width: 1600,
              height: 900,
              extmetadata: {
                License: { value: "cc-by-2.0" },
                LicenseShortName: { value: "CC BY 2.0" },
                Artist: { value: '<a href="/wiki/User:Jane">Jane Doe</a>' },
                ImageDescription: { value: "An example subject" },
                ...(overrides.extmetadata as Record<string, unknown> | undefined),
              },
            },
          ],
        },
      },
    },
  };
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

function imageResponse(): Response {
  return new Response(Buffer.from("fake-image-bytes", "utf8"), {
    headers: { "content-type": "image/jpeg" },
  });
}

/** A mock fetch that answers Commons API searches and thumbnail downloads. */
function makeFetch(
  searchResponse: () => Response
): jest.MockedFunction<typeof fetch> {
  return jest.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/w/api.php")) {
      return searchResponse();
    }
    if (url === THUMB_URL) {
      return imageResponse();
    }
    throw new Error(`Unexpected fetch: ${url}`);
  }) as jest.MockedFunction<typeof fetch>;
}

async function makeProjectRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "article-covers-"));
}

async function writeArticle(
  projectRoot: string,
  slug: string,
  frontmatter: string
): Promise<string> {
  const dir = path.join(projectRoot, "content", "blog");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${slug}.mdx`);
  await fs.writeFile(filePath, `${frontmatter}\n\n# ${slug}\n\nBody.\n`, "utf8");
  return filePath;
}

const HOROLOGY_FRONTMATTER = `---
title: "A Short History of Horology"
excerpt: "From sundials to atomic clocks."
publishedAt: "2026-06-09"
category: "Essay"
tags: ["Horology"]
featured: false
archiveBucket: "Signals & Commentary"
author: "Isaac Vazquez"
seo:
  title: "A Short History of Horology"
  description: "A history of timekeeping."
---`;

const EARTHQUAKE_FRONTMATTER = `---
title: "Building an Earthquake Dashboard"
excerpt: "A calm read on a firehose."
publishedAt: "2026-05-01"
category: "Data Product"
tags: ["Dashboards"]
featured: false
archiveBucket: "Space & Experiments"
author: "Isaac Vazquez"
coverImage: "/writing/building-an-earthquake-dashboard/opengraph-image"
---`;

describe("applyCoverFrontmatter", () => {
  const fields = {
    coverImage: "/images/writing/covers/x.jpg",
    coverImageAlt: "Alt text",
    coverImageCredit: "Jane Doe, CC BY 2.0 via Wikimedia Commons",
    coverImageCreditUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
  };

  it("inserts the four fields after author, before seo", () => {
    const out = applyCoverFrontmatter(HOROLOGY_FRONTMATTER, fields);
    expect(out).toContain('coverImage: "/images/writing/covers/x.jpg"');
    expect(out).toContain('coverImageAlt: "Alt text"');
    expect(out).toContain(
      'coverImageCredit: "Jane Doe, CC BY 2.0 via Wikimedia Commons"'
    );
    // Placed between author and the seo block.
    expect(out.indexOf("author:")).toBeLessThan(out.indexOf("coverImage:"));
    expect(out.indexOf("coverImage:")).toBeLessThan(out.indexOf("seo:"));
    // Untouched fields survive.
    expect(out).toContain('title: "A Short History of Horology"');
  });

  it("replaces an existing coverImage line in place", () => {
    const out = applyCoverFrontmatter(EARTHQUAKE_FRONTMATTER, fields);
    expect(out).not.toContain("opengraph-image");
    expect(out).toContain('coverImage: "/images/writing/covers/x.jpg"');
    // Exactly one coverImage line.
    expect(out.match(/^coverImage:/gm)).toHaveLength(1);
  });

  it("is idempotent", () => {
    const once = applyCoverFrontmatter(HOROLOGY_FRONTMATTER, fields);
    const twice = applyCoverFrontmatter(once, fields);
    expect(twice).toEqual(once);
  });
});

describe("buildArticleCoverImages", () => {
  it("downloads a photo and writes attribution for a wikimedia entry", async () => {
    const projectRoot = await makeProjectRoot();
    await writeArticle(projectRoot, "a-history-of-horology", HOROLOGY_FRONTMATTER);
    const fetchImpl = makeFetch(() => commonsSearchResponse());

    const result = await buildArticleCoverImages({
      projectRoot,
      fetchImpl,
      only: ["a-history-of-horology"],
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    expect(result.updated).toEqual(["a-history-of-horology"]);
    expect(result.failed).toEqual([]);

    const savedImage = path.join(
      projectRoot,
      "public/images/writing/covers/a-history-of-horology.jpg"
    );
    expect(await fs.readFile(savedImage, "utf8")).toBe("fake-image-bytes");

    const article = await fs.readFile(
      path.join(projectRoot, "content/blog/a-history-of-horology.mdx"),
      "utf8"
    );
    expect(article).toContain(
      'coverImage: "/images/writing/covers/a-history-of-horology.jpg"'
    );
    expect(article).toContain(
      'coverImageCredit: "Jane Doe, CC BY 2.0 via Wikimedia Commons"'
    );
    expect(article).toContain(
      'coverImageCreditUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg"'
    );
  });

  it("skips a post that already has a cover unless forced", async () => {
    const projectRoot = await makeProjectRoot();
    await writeArticle(projectRoot, "a-history-of-horology", HOROLOGY_FRONTMATTER);
    const coversDir = path.join(projectRoot, "public/images/writing/covers");
    await fs.mkdir(coversDir, { recursive: true });
    await fs.writeFile(
      path.join(coversDir, "a-history-of-horology.jpg"),
      "existing"
    );
    const fetchImpl = makeFetch(() => commonsSearchResponse());

    const result = await buildArticleCoverImages({
      projectRoot,
      fetchImpl,
      only: ["a-history-of-horology"],
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    expect(result.skipped).toEqual(["a-history-of-horology"]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails soft when only non-free images match, leaving frontmatter intact", async () => {
    const projectRoot = await makeProjectRoot();
    const articlePath = await writeArticle(
      projectRoot,
      "a-history-of-horology",
      HOROLOGY_FRONTMATTER
    );
    const fetchImpl = makeFetch(() =>
      commonsSearchResponse({
        extmetadata: {
          License: { value: "fair use" },
          LicenseShortName: { value: "Fair use" },
        },
      })
    );

    const result = await buildArticleCoverImages({
      projectRoot,
      fetchImpl,
      only: ["a-history-of-horology"],
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    expect(result.updated).toEqual([]);
    expect(result.failed).toHaveLength(1);
    expect(await fs.readFile(articlePath, "utf8")).toEqual(
      `${HOROLOGY_FRONTMATTER}\n\n# a-history-of-horology\n\nBody.\n`
    );
  });

  it("leaves editorial-card and manual entries untouched", async () => {
    const projectRoot = await makeProjectRoot();
    const fetchImpl = makeFetch(() => commonsSearchResponse());

    const result = await buildArticleCoverImages({
      projectRoot,
      fetchImpl,
      only: ["is-rag-dead-2026", "world-cup-2026-contenders-1-spain"],
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    expect(result.keptCard).toEqual(["is-rag-dead-2026"]);
    expect(result.manual).toEqual(["world-cup-2026-contenders-1-spain"]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
