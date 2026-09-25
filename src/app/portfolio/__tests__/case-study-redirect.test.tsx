import CaseStudyPage from "../[slug]/page";
import { caseStudiesData } from "@/constants/caseStudies";

// The real helpers throw to stop rendering, so the mocks do too.
const mockPermanentRedirect = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
const mockRedirect = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});

jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  permanentRedirect: (url: string) => mockPermanentRedirect(url),
  redirect: (url: string) => mockRedirect(url),
}));

describe("case study route", () => {
  it("moves a case study that became a live tool with a permanent redirect", async () => {
    const [slug, caseStudy] =
      Object.entries(caseStudiesData).find(([, study]) => study.link) ?? [];
    expect(caseStudy?.link).toBeTruthy();

    await expect(
      CaseStudyPage({ params: Promise.resolve({ slug: slug as string }) })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockPermanentRedirect).toHaveBeenCalledWith(caseStudy?.link);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
