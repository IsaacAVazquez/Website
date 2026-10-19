export interface FAQItem {
  question: string;
  answer: string;
}

/*
 * The questions keep the third person a recruiter or a search engine would
 * use, and the answers are in Isaac's voice, so the page reads as one voice
 * and the FAQ structured data on /about still matches what is printed there.
 */
export const ABOUT_FAQ: FAQItem[] = [
  {
    question: "What roles is Isaac looking for after Berkeley Haas?",
    answer:
      "I'm looking for a full-time role in product management, product marketing, or program management that starts after I graduate from UC Berkeley Haas in May 2027, and I'm interested in consumer tech broadly, fintech and AI workflows included.",
  },
  {
    question: "What was Isaac's product and engineering background before business school?",
    answer:
      "Before business school I spent six years in campaign data and QA, including three and a half years at Civitech, where my QA role grew into product work. I owned the product vision for the TextOut texting platform, led a pricing initiative that generated $4M in additional revenue in 2024, and helped launch RunningMate.",
  },
  {
    question: "What did Isaac do during his summer 2026 MBA internship?",
    answer:
      "In summer 2026 I was the MBA growth intern at Juno, a fintech company that negotiates group rates on student loans, where I worked on funnel conversion analysis, a matched estimate of what advising meetings were worth, and member activation.",
  },
  {
    question: "What technical areas and tools does Isaac build with?",
    answer:
      "I work on product strategy, evaluating agentic AI workflows, context engineering, quality systems, test automation, fintech processor economics, and data-dense web applications built with Next.js, TypeScript, and automated snapshot pipelines, which is what most of this site is.",
  },
];
