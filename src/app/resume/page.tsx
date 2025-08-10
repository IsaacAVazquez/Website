import { constructMetadata } from "@/lib/seo";
import ResumeClient from "./resume-client";

export const metadata = constructMetadata({
  title: "Resume",
  description: "View Isaac Vazquez's professional resume. QA Engineer with 6+ years of experience in test automation, performance testing, and ensuring software quality for millions of users.",
  canonicalUrl: "/resume",
});

export default function ResumePage() {
  return <ResumeClient />;
}