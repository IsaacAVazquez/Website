import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { WarmCard } from "@/components/ui/WarmCard";
import { Badge } from "@/components/ui/Badge";
import { ModernButton } from "@/components/ui/ModernButton";
import { FAQSection } from "@/components/FAQ/FAQSection";

export const metadata: Metadata = constructMetadata({
  title: "FAQ - Product Management, Strategy & UC Berkeley MBA | Isaac Vazquez",
  description: "Frequently asked questions about product management, product strategy, cross-functional leadership, and UC Berkeley Haas MBA experiences. Learn about Isaac Vazquez's approach to data-driven product decisions, user research, go-to-market strategy, and transitioning from engineering to product management.",
  canonicalUrl: "https://isaacavazquez.com/faq",
  dateModified: "2025-02-05",
  aiMetadata: {
    expertise: [
      "Product Management",
      "Product Strategy",
      "Product Discovery",
      "Cross-functional Leadership",
      "Data-Driven Decisions",
      "User Research",
      "Go-to-Market Strategy",
    ],
    specialty: "Technical Product Management",
    profession: "Product Manager",
    industry: ["Technology", "SaaS"],
    topics: ["Product Management", "MBA", "Career Transition", "Technical PM"],
    contentType: "FAQ",
    context: "UC Berkeley Haas MBA Candidate with 6+ years in product and quality engineering",
    primaryFocus: "Product Management Career and Strategy Insights",
  },
});

const faqCategories = [
  {
    category: "Career & Current Focus",
    badge: "Career",
    questions: [
      {
        question: "What is Isaac Vazquez's current role and career focus?",
        answer: "I'm a full-time MBA candidate at UC Berkeley Haas (Class of 2027) after six years in QA, data, and digital strategy. I'm focused on product management roles where I can bring structure to ambiguous problems, translate customer needs into clear stories, and ship reliable web and data applications."
      },
      {
        question: "What kind of product management roles is Isaac seeking?",
        answer: "I'm targeting PM and APM roles that value technical fluency, user empathy, and cross-functional leadership. I do my best work when I can partner closely with engineering, design, and analytics to turn interviews, telemetry, and experiments into prioritized plans for workflow or data-heavy platforms."
      },
      {
        question: "What makes Isaac qualified for product management roles?",
        answer: "I blend six years of QA automation, SQL and Python pipelines, and cross-functional execution with the strategy work I'm doing at Berkeley Haas. At Open Progress I ran client campaigns, built reporting and ETL flows, and used usage data to shape what we built. After we joined Civitech I moved into QA and applications engineering, wrote test plans, broke down stories, mapped user journeys, and helped take our RunningMate product from concept to launch while owning stakeholder communication."
      },
      {
        question: "Where is Isaac located and open to working?",
        answer: "I'm based in the San Francisco Bay Area while attending UC Berkeley Haas and maintain strong ties to Austin, Texas. I'm open to opportunities in both locations as well as remote teams. Splitting time between the two hubs lets me leverage both networks and understand how different organizations operate."
      },
    ]
  },
  {
    category: "Product Management & Strategy",
    badge: "Product",
    questions: [
      {
        question: "How do you approach product discovery and validation?",
        answer: "I start by framing the opportunity with real user input, support signals, and product analytics, then distill that into a clear hypothesis. From there I partner with design and engineering to shape discovery experiments, instrument the right metrics, and run lean tests that tell us whether to double down or pivot. Every learning loops back into the roadmap and ensures we're shipping what customers actually need."
      },
      {
        question: "What product management experience do you bring from Civitech and your MBA work?",
        answer: "At Open Progress I ran digital strategy projects, built reporting pipelines in SQL and Python, and surfaced usage insights that guided what we built next. After the acquisition by Civitech I moved into QA and applications engineering so I could sit inside the build process. I wrote test plans, decomposed stories, defined product behavior, and partnered with PMs, engineers, and data teams to take the RunningMate platform from concept to launch. Berkeley Haas complements that with structured work in strategy, go-to-market, and venture that keeps me thinking in systems while staying grounded in execution."
      },
      {
        question: "What kinds of product roles are you exploring during recruiting?",
        answer: "I'm focused on PM roles where a technical foundation and rigorous quality mindset matter, particularly in B2B SaaS, workflow tools, or data-intensive applications. I look for teams that value product discovery, data-informed decision making, and cross-functional storytelling."
      }
    ]
  },
  {
    category: "Education & MBA Experience",
    badge: "MBA",
    questions: [
      {
        question: "What is Isaac studying at UC Berkeley Haas?",
        answer: "I'm pursuing an MBA at UC Berkeley Haas School of Business (Class of 2027), focusing on Product Management, Strategy, and Venture Capital. As a Consortium Fellow and MLT Professional Development Fellow, I'm deepening my strategic thinking, financial analysis, and leadership capabilities. My coursework includes product strategy, go-to-market execution, data-driven decision making, and organizational behavior. All of it ties directly back to real product work."
      },
      {
        question: "How does the MBA enhance Isaac's product management capabilities?",
        answer: "Business school has fundamentally transformed how I approach product development and team leadership. At UC Berkeley Haas I've learned frameworks for strategic thinking, financial analysis, market sizing, and competitive positioning that complement my technical background. I can now evaluate product opportunities through multiple lenses such as market analysis, unit economics, operational feasibility, and organizational impact while building and leading diverse teams to execute complex initiatives."
      },
      {
        question: "What is the Consortium Fellowship and MLT Fellowship?",
        answer: "The Consortium Fellowship is a prestigious graduate business fellowship for underrepresented minorities, providing leadership development, corporate partnerships, and a strong alumni network. MLT (Management Leadership for Tomorrow) is a professional development program that accelerates career advancement through coaching, skills training, and executive mentorship. Both fellowships demonstrate my commitment to leadership, diversity & inclusion, and continuous professional growth. They've connected me with diverse business leaders and expanded my understanding of how product management impacts different industries and markets."
      },
      {
        question: "What unique value does Isaac bring from UC Berkeley Haas?",
        answer: "UC Berkeley Haas emphasizes the Defining Leadership Principles: Question the Status Quo, Confidence Without Attitude, Students Always, and Beyond Yourself. These principles align perfectly with product management because they encourage challenging assumptions, collaborating humbly, learning continuously, and building products that serve real users. The Bay Area location also provides access to cutting-edge companies, product leaders, and innovation ecosystems, and I bring both the Haas culture and network to every product role."
      },
    ]
  },
  {
    category: "Technical Skills & Background",
    badge: "Technical",
    questions: [
      {
        question: "What technical skills does Isaac bring to product management?",
        answer: "I have extensive technical skills including: SQL and data analysis (6+ years experience), test automation with Cypress, API testing, Agile/Scrum methodologies, data visualization with Sisense and Tableau, ETL pipeline development, experimentation frameworks, QA methodologies, DevOps integration, cloud platforms (GCP), and AI/LLM tool integration. This technical depth lets me understand engineering constraints, make informed trade-off decisions, and speak the language of technical teams while staying focused on business outcomes."
      },
      {
        question: "How does Isaac's QA background benefit product management?",
        answer: "My QA background provides unique advantages in product management: (1) deep empathy for users because I'm trained to think about edge cases and user journeys, (2) a data-driven mindset so I naturally instrument, measure, and validate assumptions, (3) risk assessment skills that help me evaluate technical feasibility and identify potential failure modes early, (4) a focus on quality that keeps reliability and scalability in scope from day one, and (5) cross-functional fluency that lets me bridge conversations between engineering, design, and business stakeholders with technical credibility."
      },
      {
        question: "What product management tools and methodologies does Isaac use?",
        answer: "I'm proficient with modern product management tools and frameworks including: Agile/Scrum methodologies, user story mapping, Jobs-to-be-Done framework, Lean product development, A/B testing and experimentation platforms, SQL for data analysis and user behavior insights, analytics tools (Google Analytics, Mixpanel, Amplitude), roadmapping tools (ProductBoard, Jira, Asana), prototyping tools (Figma), and data visualization (Tableau, Sisense). I adapt my toolset based on team needs and product stage."
      },
      {
        question: "How does Isaac approach data-driven product decisions?",
        answer: "I approach data-driven decision making through a structured framework: (1) define clear metrics aligned with business goals, (2) instrument tracking early, (3) use both quantitative data (usage metrics, conversion funnels) and qualitative insights (user interviews, support tickets), (4) run disciplined experiments with proper statistical rigor, and (5) balance data with user empathy and strategic context because data informs but does not dictate. My SQL and analytics background lets me dig deep into user behavior independently."
      },
      {
        question: "What is Isaac's approach to working with engineering teams?",
        answer: "My technical background allows me to work effectively with engineering teams by (1) speaking their language so I understand technical constraints, architecture decisions, and testing strategies, (2) writing clear specifications and user stories, (3) balancing business requirements with technical feasibility, (4) respecting engineering time and contributing to technical discussions, and (5) advocating for quality, maintainability, and technical debt management. Engineers appreciate PMs who understand complexity and avoid oversimplifying implementation challenges."
      }
    ]
  },
  {
    category: "Industry Focus & Experience",
    badge: "Experience",
    questions: [
      {
        question: "What industries and company types interest Isaac?",
        answer: "I'm excited by B2B SaaS, workflow automation, developer productivity, and other modern web applications that depend on clean data flows and thoughtful UX. I look for companies where quality signals, analytics, and stakeholder management all influence the roadmap."
      },
      {
        question: "What is Isaac's experience at Civitech?",
        answer: "At Civitech I worked across multiple web applications as a QA analyst and applications engineer. I owned quality strategy for major releases, wrote and automated test plans, mapped user journeys, and partnered with PMs, engineers, and data teams to take the RunningMate platform from concept to launch. I also helped rewrite a flagship application, stood up internal tooling, and managed backlogs so stakeholders knew what to expect each sprint."
      },
      {
        question: "How does Isaac balance Austin roots with Bay Area innovation?",
        answer: "Austin taught me to build relationships, communicate clearly with stakeholders, and stay pragmatic. The Bay Area pushes me to move faster, experiment, and think bigger with data and tooling. Bringing both mindsets lets me bridge different communication styles and help teams ship without losing the human element."
      },
      {
        question: "What is Isaac's experience with cross-functional leadership?",
        answer: "I've led cross-functional product initiatives coordinating engineers, designers, data analysts, customer success, and executives. Key examples include: leading 8-person engineering team on RunningMate platform launch, partnering with legal and product teams on compliance features, driving pricing strategy across finance, sales, and engineering, and transforming client onboarding processes across multiple departments. I excel at building alignment, managing stakeholder expectations, and keeping teams focused on shared goals while navigating competing priorities."
      },
      {
        question: "How does Isaac ensure products stay grounded in quality and data?",
        answer: "I treat quality, analytics, and stakeholder trust as non-negotiable. That means defining success metrics up front, building instrumentation, validating flows through manual and automated tests, and creating tight feedback loops with design, engineering, and go-to-market teams. I make sure every launch has a plan for measuring adoption, reliability, and business impact."
      }
    ]
  },
  {
    category: "Contact & Networking",
    badge: "Network",
    questions: [
      {
        question: "How can I contact Isaac Vazquez?",
        answer: "You can reach me via email at isaacavazquez95@gmail.com, on LinkedIn at linkedin.com/in/isaac-vazquez, on GitHub at github.com/IsaacAVazquez, or through the contact form at isaacavazquez.com/contact. I'm responsive to product management roles, consulting or QA advisory work, speaking invites, and mentorship conversations."
      },
      {
        question: "What kinds of conversations and collaborations interest Isaac?",
        answer: "I'm most energized by discussions about product strategy, user journey mapping, data instrumentation, quality practices, and stakeholder management. I love connecting with PMs, engineers moving into product roles, and founders building web or data-intensive apps."
      },
      {
        question: "Is Isaac open to mentorship or coffee chats?",
        answer: "Absolutely. I'm happy to share what I've learned about moving from QA and data roles into product management, navigating MBA applications, or building high-quality web applications. Whether you're considering a product career or refining process on your team, I'm glad to compare notes."
      },
      {
        question: "Is Isaac available for speaking engagements or panels?",
        answer: "Yes. I'm interested in speaking about moving from QA to product, designing data-informed product processes, building reliable web apps, or MBA lessons for technical operators. I'm available for company talks, conference panels, university events, and meetups in Austin or the Bay Area."
      },
      {
        question: "What is the best way to get Isaac's attention for opportunities?",
        answer: "A thoughtful message that covers the role, the product, and why you think my QA and data background fits is the best way to reach me. I prioritize opportunities on teams building web or data-intensive products where technical depth and stakeholder alignment both matter."
      }
    ]
  }
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqCategories.flatMap(category =>
    category.questions.map(qa => ({
      "@type": "Question",
      "name": qa.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": qa.answer
      }
    }))
  )
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />

      <div className="min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--surface-secondary)]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Heading level={1} className="mb-4 text-4xl md:text-5xl lg:text-6xl text-[var(--text-primary)]">
              Frequently Asked{" "}
              <span className="text-[var(--color-secondary)]">
                Questions
              </span>
            </Heading>
            <Paragraph size="lg" className="max-w-2xl mx-auto text-[var(--text-secondary)]">
              Learn about product management, transitioning from engineering to product roles,
              UC Berkeley MBA experiences, and connecting for opportunities on web, workflow, and data-intensive products.
            </Paragraph>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <section key={categoryIndex} className="space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <Badge variant="default">
                    {category.badge}
                  </Badge>
                  <Heading level={2} className="text-2xl text-[var(--color-primary)]">
                    {category.category}
                  </Heading>
                </div>

                <div className="space-y-4">
                  {category.questions.map((qa, qaIndex) => (
                    <FAQSection
                      key={qaIndex}
                      question={qa.question}
                      answer={qa.answer}
                      defaultOpen={categoryIndex === 0 && qaIndex === 0}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-16">
            <WarmCard padding="xl" className="text-center">
              <Heading level={2} className="mb-4 text-[var(--color-primary)]">
                Have More Questions?
              </Heading>
              <Paragraph className="text-[var(--text-secondary)] mb-6 max-w-2xl mx-auto">
                Didn't find what you're looking for? I'd love to connect about product management opportunities,
                share perspectives on building web and data-intensive products, or discuss transitioning into product roles. Always open to thoughtful conversations.
              </Paragraph>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ModernButton variant="primary">
                  <a href="/contact">Get in Touch</a>
                </ModernButton>
                <ModernButton variant="outline">
                  <a href="/resume">View My Work</a>
                </ModernButton>
              </div>
            </WarmCard>
          </div>
        </div>
      </div>
    </>
  );
}
