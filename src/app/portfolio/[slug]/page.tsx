import { notFound, permanentRedirect } from "next/navigation";
import { caseStudiesData } from "@/constants/caseStudies";

/*
 * Every case study became a live tool, so this route only forwards old
 * /portfolio/<slug> links to the tool. The case study template that used to
 * render here was deleted on 2026-10-02 because no slug reached it. A
 * permanent redirect, since a temporary one is only a weak signal to Google
 * that the tool is the real page.
 */
export async function generateStaticParams() {
  return Object.keys(caseStudiesData).map((slug) => ({ slug }));
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = caseStudiesData[slug]?.link;

  if (!link) {
    notFound();
  }

  permanentRedirect(link);
}
