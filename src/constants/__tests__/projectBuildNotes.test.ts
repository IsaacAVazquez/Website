import fs from "fs";
import path from "path";
import { caseStudiesData, PROJECT_BUILD_NOTES } from "@/constants/caseStudies";

describe("PROJECT_BUILD_NOTES", () => {
  it("maps only real projects to posts that exist", () => {
    for (const [project, post] of Object.entries(PROJECT_BUILD_NOTES)) {
      expect(caseStudiesData[project]).toBeDefined();
      expect(fs.existsSync(path.join(process.cwd(), "content", "blog", `${post}.mdx`))).toBe(true);
    }
  });
});
