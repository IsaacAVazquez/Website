jest.mock("fs");
jest.mock("gray-matter");
jest.mock("remark", () => ({
  remark: jest.fn(() => ({
    use: jest.fn().mockReturnThis(),
    process: jest.fn().mockResolvedValue({ toString: () => "<p>Processed update</p>" }),
  })),
}));
jest.mock("remark-gfm", () => jest.fn());
jest.mock("remark-rehype", () => jest.fn());
jest.mock("rehype-sanitize", () => jest.fn());
jest.mock("rehype-stringify", () => jest.fn());

import fs from "fs";
import matter from "gray-matter";
import { remark } from "remark";
import rehypeSanitize from "rehype-sanitize";
import { getAllChangelogEntries } from "../changelog";

const mockFs = fs as jest.Mocked<typeof fs>;
const mockMatter = matter as unknown as jest.Mock;
const mockRemark = remark as unknown as jest.Mock;
const mockRehypeSanitize = rehypeSanitize as unknown as jest.Mock;

describe("getAllChangelogEntries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.mkdirSync = jest.fn();
    mockFs.readdirSync = jest.fn().mockReturnValue(["security-update.md"]);
    mockFs.readFileSync = jest.fn().mockReturnValue("raw changelog");
    mockMatter.mockReturnValue({
      data: {
        title: "Security update",
        publishedAt: "2026-04-29",
        summary: "Hardened public endpoints.",
      },
      content: "Body",
    });
  });

  it("renders markdown with sanitization enabled", async () => {
    await getAllChangelogEntries();
    const processor = mockRemark.mock.results.at(-1)?.value;

    expect(processor.use).toHaveBeenCalledWith(mockRehypeSanitize);
  });
});
