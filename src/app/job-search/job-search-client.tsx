"use client";

import { startTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildJobSearchHref,
  normalizeJobSearchState,
} from "./job-search-state";
import type { JobSearchState, JobSearchView } from "@/types/jobsearch";
import { JobSearchTabs } from "./components/JobSearchTabs";
import { ApplicationTracker } from "./components/ApplicationTracker";
import { CoverLetterGenerator } from "./components/CoverLetterGenerator";
import { InterviewPrepCoach } from "./components/InterviewPrepCoach";

interface JobSearchClientProps {
  initialState: JobSearchState;
}

export function JobSearchClient({ initialState }: JobSearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasManagedParams = searchParams.get("view") !== null;
  const routeState = useMemo(
    () => (hasManagedParams ? normalizeJobSearchState(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams]
  );

  const activeView = routeState.view;

  function handleTabChange(view: JobSearchView) {
    startTransition(() => {
      router.replace(buildJobSearchHref({ view }));
    });
  }

  return (
    <section className="home-page home-section min-h-screen" aria-label="Job Search Hub">
      <div className="home-shell space-y-10">
        <header className="space-y-4 max-w-3xl">
          <p className="home-kicker mb-0">Tools &middot; Job Search</p>
          <h1
            className="mb-0"
            style={{
              fontFamily: "var(--font-home-sans)",
              fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
              fontWeight: 600,
              lineHeight: 0.95,
              letterSpacing: "-0.06em",
              color: "var(--home-ink)",
            }}
          >
            Job Search Hub
          </h1>
          <p className="home-body">
            Track applications, generate tailored cover letters, and practice
            for interviews — all in one place.
          </p>
        </header>

        <JobSearchTabs activeView={activeView} onTabChange={handleTabChange} />

        {activeView === "tracker" && <ApplicationTracker />}
        {activeView === "cover-letter" && <CoverLetterGenerator />}
        {activeView === "interview-prep" && <InterviewPrepCoach />}
      </div>
    </section>
  );
}
