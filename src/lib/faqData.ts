// FAQ Data for Product Management Portfolio - SEO Optimized

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export const productManagementFAQs: FAQItem[] = [
  {
    question: "What is your product management experience?",
    answer: "I have 6+ years of experience in product-adjacent roles including quality assurance, data analytics, and technology at organizations like Civitech (civic tech), Open Progress (political campaigns), and Florida State University. I'm currently pursuing my MBA at UC Berkeley Haas to deepen my product management expertise.",
    category: "Experience"
  },
  {
    question: "What kind of product management roles are you looking for?",
    answer: "I'm seeking Associate Product Manager (APM) or Product Manager roles in Austin TX or the San Francisco Bay Area, particularly in civic tech, SaaS, or mission-driven startups. I'm interested in opportunities that leverage my technical background, data analytics skills, and passion for social impact.",
    category: "Career"
  },
  {
    question: "What is your technical background?",
    answer: "I have extensive technical experience including quality assurance leadership, test automation (Cypress), SQL and data analysis, API testing, and Agile/Scrum methodologies. I led QA initiatives at Civitech for voter engagement platforms and built testing frameworks that improved product quality and release velocity.",
    category: "Skills"
  },
  {
    question: "Why are you pursuing an MBA at UC Berkeley Haas?",
    answer: "I'm pursuing my MBA at UC Berkeley Haas (Class of '27, Consortium Fellow) to deepen my product management expertise, explore venture capital opportunities in civic tech and SaaS, and build a network in the Bay Area tech ecosystem. Haas is sharpening my skills in product strategy, go-to-market planning, and cross-functional leadership.",
    category: "Education"
  },
  {
    question: "What types of products have you worked on?",
    answer: "I've worked on voter engagement platforms at Civitech, digital campaign tools at Open Progress, and data analytics systems at Florida State University. My experience spans civic tech, political technology, SaaS platforms, and data visualization tools.",
    category: "Experience"
  },
  {
    question: "What is your approach to product management?",
    answer: "I take a data-driven, user-focused approach to product management. I believe in balancing user insight, data analysis, and disciplined execution while collaborating cross-functionally with engineering, design, and stakeholders. I prioritize features based on user value, technical feasibility, and business impact.",
    category: "Philosophy"
  },
  {
    question: "What product management skills do you bring?",
    answer: "I bring strong skills in product strategy, roadmapping, user experience optimization, cross-functional collaboration, stakeholder management, data-driven decision making, metrics definition, A/B testing, SQL and data analysis, Agile/Scrum methodologies, and quality assurance.",
    category: "Skills"
  },
  {
    question: "Are you available for product management consulting?",
    answer: "Yes, I'm available for product management consulting engagements, particularly for civic tech organizations, mission-driven startups, or SaaS companies looking for help with product strategy, quality engineering advisory, or product operations. Contact me to discuss your needs.",
    category: "Consulting"
  },
  {
    question: "What makes you different as a product manager?",
    answer: "My unique combination of technical quality engineering background, data analytics expertise, and passion for mission-driven products sets me apart. I understand the technical constraints that engineering teams face, can analyze data to inform product decisions, and am deeply committed to building products that create social impact.",
    category: "Value Proposition"
  },
  {
    question: "Where are you located and where can you work?",
    answer: "I'm based in the Bay Area while attending UC Berkeley Haas and have strong ties to Austin, TX. I'm open to opportunities in both locations as well as remote positions with mission-driven organizations.",
    category: "Location"
  }
];

// Generate structured data for FAQPage schema
export function generateFAQStructuredData(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}
