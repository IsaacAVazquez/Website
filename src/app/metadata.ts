/**
 * Homepage Metadata with AI Optimization
 */

import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Isaac Vazquez - Technical Product Manager | UC Berkeley MBA Candidate",
  description:
    "Product Manager & UC Berkeley Haas MBA Candidate '27 seeking APM/PM roles in Austin TX and San Francisco Bay Area. 6+ years experience in civic tech, SaaS, quality assurance leadership, and data analytics. Technical background with expertise in product strategy, cross-functional collaboration, and data-driven decision making.",
  canonicalUrl: "/",
  aiMetadata: {
    profession: "Technical Product Manager",
    specialty: "Product Management, Quality Engineering, Civic Technology",
    expertise: [
      "Product Strategy",
      "Product Discovery",
      "User Research",
      "Data Analysis",
      "Quality Assurance",
      "Test Automation",
      "Stakeholder Management",
      "Go-to-Market Planning",
    ],
    industry: ["Civic Technology", "SaaS", "Technology"],
    topics: [
      "Product Management",
      "Quality Engineering",
      "Civic Tech",
      "MBA Education",
      "Career Transition",
    ],
    contentType: "Professional Portfolio Homepage",
    context:
      "Homepage of Isaac Vazquez, a technical product manager transitioning into product management with 6+ years of experience in quality assurance and civic technology. Currently pursuing MBA at UC Berkeley Haas School of Business.",
    summary:
      "Professional portfolio showcasing Isaac Vazquez's journey from QA engineering to product management, highlighting expertise in civic tech, data analysis, and mission-driven product development.",
    primaryFocus:
      "Product management expertise, technical background, and career trajectory in civic technology",
  },
});
