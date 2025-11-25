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
    industry: ["Technology", "SaaS", "Civic Tech"],
    topics: ["Product Management", "MBA", "Career Transition", "Technical PM"],
    contentType: "FAQ",
    context: "UC Berkeley Haas MBA Candidate with 6+ years in product and quality engineering",
    primaryFocus: "Product Management Career and Strategy Insights",
  },
});

// FAQ Data with structured format
const faqCategories = [
  {
    category: "Career & Current Focus",
    badge: "Career",
    questions: [
      {
        question: "What is Isaac Vazquez's current role and career focus?",
        answer: "I'm currently a Quality Assurance Engineer at Civitech while pursuing an MBA at UC Berkeley Haas School of Business (Class of 2027). I'm transitioning into product management roles, seeking Associate Product Manager or Product Manager positions in Austin TX or the San Francisco Bay Area. My focus is on civic tech, SaaS, or mission-driven startups where I can leverage my technical background and strategic thinking."
      },
      {
        question: "What kind of product management roles is Isaac seeking?",
        answer: "I'm seeking Associate Product Manager (APM) or Product Manager roles where technical depth and mission-driven mindset matter. Ideal opportunities are in civic tech, SaaS platforms, or mission-driven startups that value product discovery, data-informed decision making, and cross-functional collaboration. I'm particularly excited about teams that balance user insight with analytical rigor and ship products that create meaningful impact."
      },
      {
        question: "What makes Isaac qualified for product management roles?",
        answer: "I bring a unique combination of technical depth (6+ years in QA and test automation), analytical skills (SQL, data analysis, experimentation), strategic thinking (UC Berkeley MBA), and proven impact (60M+ users reached, 56% NPS improvement, 90% defect reduction, $4M revenue generation). My background bridges engineering, analytics, and strategy—enabling me to understand technical constraints while driving business outcomes. As a Consortium Fellow and MLT Fellow, I also bring leadership development and diverse perspectives."
      },
      {
        question: "Where is Isaac located and open to working?",
        answer: "I'm based in the San Francisco Bay Area while attending UC Berkeley Haas and maintain strong ties to Austin, Texas. I'm open to opportunities in both locations (Austin TX and San Francisco Bay Area) and remote positions with mission-driven organizations. My dual-location presence provides flexibility and allows me to leverage networks in both tech hubs."
      },
    ]
  },
  {
    category: "Product Management & Strategy",
    badge: "Product",
    questions: [
      {
        question: "How do you approach product discovery and validation?",
        answer: "I start by framing the opportunity with real user input—interviews, support signals, and product analytics—and distill that into a clear hypothesis. From there I partner with design and engineering to shape discovery experiments, instrument the right metrics, and run lean tests that tell us whether to double down or pivot. Every learning cycles back into the roadmap and ensures we're shipping what customers actually need."
      },
      {
        question: "What product management experience do you bring from Civitech and your MBA work?",
        answer: "At Civitech I translate civic engagement needs into product bets serving more than 60 million voters, blending delivery leadership with my QA background to keep launches reliable. At Berkeley Haas I'm sharpening that muscle with coursework in strategy, go-to-market, and venture operations, plus hands-on projects that pair me with Bay Area startups. The combination keeps me grounded in both execution and business outcomes."
      },
      {
        question: "What kinds of product roles are you exploring during recruiting?",
        answer: "I'm focused on PM roles where a technical foundation and mission-driven mindset matter—think civic tech, SaaS, or platforms that benefit from strong experimentation and quality practices. I'm especially excited about teams that value product discovery, data-informed decision making, and cross-functional storytelling."
      }
    ]
  },
  {
    category: "Education & MBA Experience",
    badge: "MBA",
    questions: [
      {
        question: "What is Isaac studying at UC Berkeley Haas?",
        answer: "I'm pursuing an MBA at UC Berkeley Haas School of Business (Class of 2027), focusing on Product Management, Strategy, and Venture Capital. As a Consortium Fellow and MLT Professional Development Fellow, I'm deepening my strategic thinking, financial analysis, and leadership capabilities. My coursework includes product strategy, go-to-market execution, data-driven decision making, and organizational behavior—all directly applicable to product management roles."
      },
      {
        question: "How does the MBA enhance Isaac's product management capabilities?",
        answer: "Business school has fundamentally transformed how I approach product development and team leadership. At UC Berkeley Haas, I've learned advanced frameworks for strategic thinking, financial analysis, market sizing, and competitive positioning that complement my technical background. I can now evaluate product opportunities through multiple lenses—market analysis, unit economics, operational feasibility, and organizational impact—while building and leading diverse teams to execute complex product initiatives. The combination of technical execution skills and strategic business thinking is rare and valuable."
      },
      {
        question: "What is the Consortium Fellowship and MLT Fellowship?",
        answer: "The Consortium Fellowship is a prestigious graduate business fellowship for underrepresented minorities, providing leadership development, corporate partnerships, and a strong alumni network. MLT (Management Leadership for Tomorrow) is a professional development program that accelerates career advancement through coaching, skills training, and executive mentorship. Both fellowships demonstrate my commitment to leadership, diversity & inclusion, and continuous professional growth. They've connected me with diverse business leaders and expanded my understanding of how product management impacts different industries and markets."
      },
      {
        question: "What unique value does Isaac bring from UC Berkeley Haas?",
        answer: "UC Berkeley Haas emphasizes the 'Defining Leadership Principles'—including Question the Status Quo, Confidence Without Attitude, Students Always, and Beyond Yourself. These principles align perfectly with product management: challenging assumptions, collaborating humbly, learning continuously, and building products that serve broader missions. The Bay Area location also provides access to cutting-edge companies, product leaders, and innovation ecosystems. I bring both the Haas culture and network to every product role."
      },
    ]
  },
  {
    category: "Technical Skills & Background",
    badge: "Technical",
    questions: [
      {
        question: "What technical skills does Isaac bring to product management?",
        answer: "I have extensive technical skills including: SQL and data analysis (6+ years experience), test automation with Cypress (expert level), API testing, Agile/Scrum methodologies, data visualization with Sisense and Tableau, ETL pipeline development, A/B testing and experimentation frameworks, quality assurance methodologies, DevOps integration, cloud platforms (GCP), and AI/LLM tool integration. This technical depth allows me to understand engineering constraints, make informed trade-off decisions, and speak the language of technical teams while maintaining focus on business outcomes."
      },
      {
        question: "How does Isaac's QA background benefit product management?",
        answer: "My QA background provides unique advantages in product management: (1) Deep empathy for users—I'm trained to think about edge cases and user journeys, (2) Data-driven mindset—I naturally instrument, measure, and validate assumptions, (3) Risk assessment—I can evaluate technical feasibility and identify potential failure modes early, (4) Quality culture—I build products with reliability and scalability in mind from day one, (5) Cross-functional fluency—I can bridge conversations between engineering, design, and business stakeholders with technical credibility."
      },
      {
        question: "What product management tools and methodologies does Isaac use?",
        answer: "I'm proficient with modern product management tools and frameworks including: Agile/Scrum methodologies, user story mapping, Jobs-to-be-Done framework, Lean product development, A/B testing and experimentation platforms, SQL for data analysis and user behavior insights, analytics tools (Google Analytics, Mixpanel, Amplitude), roadmapping tools (ProductBoard, Jira, Asana), prototyping tools (Figma), and data visualization (Tableau, Sisense). I adapt my toolset based on team needs and product stage."
      },
      {
        question: "How does Isaac approach data-driven product decisions?",
        answer: "I approach data-driven decision making through a structured framework: (1) Define clear metrics aligned with business goals, (2) Instrument tracking early (don't wait for perfect data), (3) Use both quantitative data (usage metrics, conversion funnels) and qualitative insights (user interviews, support tickets), (4) Run disciplined experiments with proper statistical rigor, (5) Balance data with user empathy and strategic context—data informs, but doesn't dictate, product decisions. My SQL and analytics background allows me to dig deep into user behavior independently."
      },
      {
        question: "What is Isaac's approach to working with engineering teams?",
        answer: "My technical background allows me to work effectively with engineering teams through: (1) Speaking their language—I understand technical constraints, architecture decisions, and testing strategies, (2) Writing clear technical specifications and user stories, (3) Balancing business requirements with technical feasibility, (4) Respecting engineering time and contributing to technical discussions, (5) Advocating for quality, maintainability, and technical debt management. Engineers appreciate PMs who understand the technical complexity and don't oversimplify implementation challenges."
      }
    ]
  },
  {
    category: "Industry Focus & Experience",
    badge: "Experience",
    questions: [
      {
        question: "What industries and company types interest Isaac?",
        answer: "I'm focused on three main areas: (1) Civic Technology—voter engagement platforms, democracy tech, government services digitization; (2) SaaS Platforms—enterprise software, B2B tools, product-led growth companies; (3) Mission-Driven Startups—social impact ventures, fintech for underserved communities, education technology, sustainability tech. I'm drawn to companies where product decisions have meaningful impact on users' lives and where I can leverage both technical skills and strategic thinking."
      },
      {
        question: "What is Isaac's experience at Civitech?",
        answer: "At Civitech, I work on voter engagement platforms serving 60M+ voters across campaigns and advocacy organizations. I've led product initiatives including: owning end-to-end product vision for TextOut platform (35% engagement increase), driving RunningMate platform launch (90% defect reduction, NPS improvement from 23 to 36), leading cross-functional pricing strategy ($4M additional revenue), and transforming client data accessibility with GCP automation (90% reduction in onboarding time). This experience taught me how to ship reliable products at scale while balancing multiple stakeholder needs."
      },
      {
        question: "How does Isaac balance Austin roots with Bay Area innovation?",
        answer: "I see this dual-location experience as a unique advantage. Austin's tech scene emphasizes community, sustainable growth, and civic impact, while the Bay Area pushes the boundaries of technological innovation and scale. I bring Austin's collaborative culture and focus on meaningful impact to Bay Area opportunities, while incorporating Silicon Valley's cutting-edge practices and ambitious thinking. This cross-pollination of ideas allows me to bridge different innovation ecosystems and bring diverse perspectives to product challenges."
      },
      {
        question: "What is Isaac's experience with cross-functional leadership?",
        answer: "I've led cross-functional product initiatives coordinating engineers, designers, data analysts, customer success, and executives. Key examples include: leading 8-person engineering team on RunningMate platform launch, partnering with legal and product teams on compliance features, driving pricing strategy across finance, sales, and engineering, and transforming client onboarding processes across multiple departments. I excel at building alignment, managing stakeholder expectations, and keeping teams focused on shared goals while navigating competing priorities."
      },
      {
        question: "How does Isaac approach building mission-driven products?",
        answer: "Mission-driven product management requires balancing impact metrics with business sustainability. At Civitech, I learned to measure success through both traditional product metrics (engagement, retention, NPS) and mission metrics (voter turnout impact, accessibility improvements, campaign reach). I believe the best mission-driven products are those that create sustainable business models—impact scales when the product is financially viable. My approach combines user empathy, data discipline, and strategic thinking to build products that do well by doing good."
      }
    ]
  },
  {
    category: "Contact & Networking",
    badge: "Network",
    questions: [
      {
        question: "How can I contact Isaac Vazquez?",
        answer: "You can reach me through: Email at isaacavazquez95@gmail.com (primary contact), LinkedIn at linkedin.com/in/isaac-vazquez (professional networking), GitHub at github.com/IsaacAVazquez (technical projects), or through my website contact form at isaacavazquez.com/contact. I'm responsive to professional inquiries about product management opportunities, consulting engagements, speaking opportunities, mentorship requests, and collaboration on civic tech or mission-driven initiatives."
      },
      {
        question: "What kinds of conversations and collaborations interest Isaac?",
        answer: "I'm most energized by discussions about product strategy, data-driven decision making, civic tech innovation, and mission-driven product development. I love connecting with fellow PMs, founders building impactful products, engineers interested in product careers, and anyone working at the intersection of technology and social good. Whether discussing product discovery frameworks, MBA learnings from UC Berkeley, or exploring how to build products that scale impact, I'm always up for meaningful conversations."
      },
      {
        question: "Is Isaac open to mentorship or coffee chats?",
        answer: "Absolutely! I'm happy to share what I've learned about transitioning from engineering to product management, navigating MBA applications (especially for underrepresented candidates), building products in civic tech, and balancing technical execution with strategic thinking. Whether you're considering a product career, exploring MBA programs, or building mission-driven products, I'm happy to share perspectives and learn from your experiences too."
      },
      {
        question: "Is Isaac available for speaking engagements or panels?",
        answer: "Yes! I'm interested in speaking opportunities related to: product management for civic tech, transitioning from engineering to product roles, data-driven product decisions, quality-minded product development, diverse leadership in tech, and MBA experiences as a Consortium and MLT Fellow. I'm available for company talks, conference panels, university events (especially UC Berkeley and FSU), and community tech meetups in Austin or the Bay Area."
      },
      {
        question: "What is the best way to get Isaac's attention for opportunities?",
        answer: "The most effective approach is a thoughtful message explaining: (1) The specific role or opportunity, (2) Why you think it's a good fit for my background, (3) What problem the product solves or mission it serves. I prioritize opportunities in civic tech, mission-driven startups, or SaaS products where technical depth and strategic thinking both matter. Clear, specific messages with mutual value propositions get the fastest responses."
      }
    ]
  }
];

// Generate structured data for FAQ
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
      
      <div className="min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#FFFCF7] dark:bg-gradient-to-br dark:from-[#1C1410] dark:via-[#2D1B12] dark:to-[#1C1410]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Heading level={1} className="mb-4 text-4xl md:text-5xl lg:text-6xl">
              Frequently Asked{" "}
              <span className="gradient-text-warm">
                Questions
              </span>
            </Heading>
            <Paragraph size="lg" className="max-w-2xl mx-auto text-[#4A3426] dark:text-[#D4A88E]">
              Learn about product management, transitioning from engineering to product roles,
              UC Berkeley MBA experiences, and connecting for opportunities in civic tech and mission-driven products.
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
                  <Heading level={2} className="text-2xl text-[#FF6B35]">
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
              <Heading level={2} className="mb-4 text-[#FF6B35]">
                Have More Questions?
              </Heading>
              <Paragraph className="text-[#4A3426] dark:text-[#D4A88E] mb-6 max-w-2xl mx-auto">
                Didn't find what you're looking for? I'd love to connect about product management opportunities,
                share perspectives on building mission-driven products, or discuss transitioning into product roles. Always open to thoughtful conversations.
              </Paragraph>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ModernButton variant="primary">
                  <a href="/contact">Get in Touch</a>
                </ModernButton>
                <ModernButton variant="outline">
                  <a href="/projects">View My Work</a>
                </ModernButton>
              </div>
            </WarmCard>
          </div>
        </div>
      </div>
    </>
  );
}
