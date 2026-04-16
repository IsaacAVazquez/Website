import { constructMetadata } from "@/lib/seo";
import { JobSearchClient } from "./job-search-client";
import { normalizeJobSearchState } from "./job-search-state";

export const metadata = constructMetadata({
  title: "Job Search Hub",
  description:
    "Track job applications, generate AI-powered cover letters, and prepare for interviews with structured practice and feedback.",
  canonicalUrl: "/job-search",
});

export default async function JobSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const state = normalizeJobSearchState(await searchParams);
  return <JobSearchClient initialState={state} />;
}
