import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { MorphButton } from "@/components/ui/MorphButton";
import { FAQSection } from "@/components/FAQ/FAQSection";

export const metadata: Metadata = constructMetadata({
  title: "Frequently Asked Questions - QA Engineering, Business Strategy & MBA Insights",
  description: "Get insights into QA engineering, business strategy, UC Berkeley MBA experiences, and connecting for meaningful conversations about technology, strategy, and impact with Isaac Vazquez.",
  canonicalUrl: "https://isaacavazquez.com/faq",
});

// FAQ Data with structured format
const faqCategories = [
  {
    category: "QA Engineering & Software Testing",
    badge: "Technical",
    questions: [
      {
        question: "What testing services do you provide as a QA Engineer?",
        answer: "As a QA Engineer, I provide comprehensive testing services including automated test development, manual testing strategies, performance testing, API testing, and test framework setup. I specialize in creating robust test suites using modern tools like Jest, Playwright, Cypress, and custom testing frameworks. My approach focuses on building maintainable, scalable testing solutions that integrate seamlessly with CI/CD pipelines."
      },
      {
        question: "How do you approach test automation for web applications?",
        answer: "My test automation approach follows the testing pyramid principle: extensive unit tests (70%), focused integration tests (20%), and strategic end-to-end tests (10%). I use tools like Jest for unit testing, Testing Library for component testing, and Playwright or Cypress for E2E testing. I emphasize writing maintainable tests with clear assertions, proper test data management, and reliable selectors that don't break with UI changes."
      },
      {
        question: "What's your experience with different testing frameworks?",
        answer: "I have extensive experience with multiple testing frameworks across different tech stacks. For JavaScript/TypeScript projects, I work with Jest, Vitest, Mocha, and Jasmine. For E2E testing, I use Playwright, Cypress, and Selenium. I'm also experienced with API testing tools like Supertest, Postman/Newman, and have worked with mobile testing frameworks. My choice of framework depends on project requirements, team preferences, and technical constraints."
      },
      {
        question: "How do you handle flaky tests and test maintenance?",
        answer: "Flaky tests are a common challenge I address through several strategies: implementing proper waits and timeouts, using deterministic test data, avoiding dependencies on external services, and writing tests that focus on behavior rather than implementation. I also advocate for regular test suite maintenance, performance monitoring, and using tools like test retries judiciously. The key is building tests that are reliable, fast, and provide clear feedback when they fail."
      },
      {
        question: "What quality assurance processes do you recommend for teams?",
        answer: "I recommend a comprehensive QA process that includes: establishing clear testing standards and documentation, implementing code review processes with testing considerations, setting up automated testing in CI/CD pipelines, conducting regular retrospectives on testing effectiveness, and fostering a culture where quality is everyone's responsibility. I also emphasize the importance of metrics tracking, such as test coverage, defect detection rates, and test execution times."
      }
    ]
  },
  {
    category: "Fantasy Football Analytics",
    badge: "Analytics",
    questions: [
      {
        question: "How do your fantasy football analytics tools work?",
        answer: "My fantasy football analytics tools combine real-time NFL data with advanced algorithms to provide actionable insights. I use machine learning techniques like K-means clustering to group players by performance patterns, D3.js for interactive visualizations, and custom algorithms for tier generation. The tools process player statistics, injury reports, matchup data, and historical performance to create comprehensive analysis dashboards that help with draft strategy and weekly lineup decisions."
      },
      {
        question: "What makes your fantasy football tools different from others?",
        answer: "My tools focus on data visualization and algorithmic analysis rather than just displaying raw statistics. I implement clustering algorithms to identify player tiers, create interactive tier charts that update in real-time, and provide mobile-optimized interfaces for draft day usage. The emphasis is on presenting complex data in intuitive, actionable formats that help users make better decisions quickly. Plus, as a software engineer, I prioritize performance, reliability, and user experience."
      },
      {
        question: "What data sources do you use for fantasy football analytics?",
        answer: "I integrate multiple reliable data sources including official NFL statistics, injury reports, weather data, and expert rankings from reputable fantasy football analysts. The system is designed to handle real-time data updates and provides data quality validation to ensure accuracy. I also incorporate advanced metrics like target share, red zone usage, and strength of schedule adjustments to provide more nuanced analysis than basic statistics alone."
      },
      {
        question: "Can you customize fantasy football tools for specific leagues?",
        answer: "Yes, I can customize tools for specific league formats including different scoring systems (PPR, standard, half-PPR), league sizes, roster configurations, and custom rules. The analytics can be adjusted for auction drafts, dynasty leagues, superflex formats, and other variations. I also provide consultation on draft strategy and can create custom dashboards that align with your league's specific needs and competitive landscape."
      },
      {
        question: "How accurate are your fantasy football projections?",
        answer: "Fantasy football projections are inherently challenging due to the unpredictable nature of sports, but my approach focuses on providing relative rankings and tier-based analysis rather than exact point predictions. The value comes from identifying trends, player groupings, and relative value propositions. I continuously refine the algorithms based on performance feedback and emphasize that projections should be one tool among many in your decision-making process."
      }
    ]
  },
  {
    category: "Technical Expertise & Services",
    badge: "Development",
    questions: [
      {
        question: "What technologies do you specialize in?",
        answer: "I specialize in modern web development with expertise in TypeScript, React, Next.js, and Node.js. For data visualization, I work extensively with D3.js and custom charting libraries. My testing expertise covers Jest, Playwright, Cypress, and various API testing tools. I'm also experienced with cloud platforms, CI/CD pipelines, database technologies, and performance optimization techniques. I stay current with industry trends and continuously expand my technical skill set."
      },
      {
        question: "Do you offer consulting services for software quality?",
        answer: "Yes, I provide consulting services for organizations looking to improve their software quality processes. This includes test strategy development, quality assurance process implementation, test automation framework setup, team training on testing best practices, and code review processes. I can work with teams to establish quality metrics, implement CI/CD testing pipelines, and create sustainable testing practices that scale with team growth."
      },
      {
        question: "How do you stay current with testing and development trends?",
        answer: "I maintain current expertise through continuous learning: following industry blogs and publications, participating in tech communities and conferences, contributing to open-source projects, experimenting with new tools and frameworks, and engaging with the Austin tech community. I also maintain this blog where I share insights and experiences, which helps me crystallize learning and connect with other professionals in the field."
      },
      {
        question: "What's your approach to working with remote teams?",
        answer: "Having worked in both remote and hybrid environments, I emphasize clear communication, comprehensive documentation, and reliable testing practices that enable distributed teams to work effectively. I use collaborative tools for code review, maintain detailed test documentation, and advocate for automated testing that provides confidence for remote deployments. I'm comfortable with asynchronous communication and understand the importance of building trust through consistent, high-quality work."
      },
      {
        question: "Can you help with legacy system testing and modernization?",
        answer: "Absolutely. Legacy system testing requires a careful, strategic approach. I start by understanding the existing system architecture and identifying critical business functions. Then I develop a comprehensive testing strategy that includes characterization tests, gradual test coverage expansion, and risk-based testing approaches. For modernization efforts, I can help establish testing foundations that enable safe refactoring and incremental improvements while maintaining system reliability."
      }
    ]
  },
  {
    category: "Location & Education",
    badge: "MBA",
    questions: [
      {
        question: "Do you provide QA services in the Bay Area and California?",
        answer: "Yes! While I'm originally based in Austin, TX, I'm currently pursuing my MBA at UC Berkeley's Haas School of Business, which gives me strong connections and availability in the San Francisco Bay Area. I provide remote QA consulting services across both Texas and California markets, and can work on-site for Bay Area clients when needed. My dual-location presence allows me to serve both Austin's emerging tech scene and Silicon Valley's innovation ecosystem."
      },
      {
        question: "How does your MBA experience enhance your QA consulting?",
        answer: "My MBA at UC Berkeley Haas adds strategic business thinking to my technical QA expertise. I can now approach quality assurance from both technical and business perspectives, helping clients understand the ROI of quality investments, align QA strategy with business objectives, and communicate technical concepts to stakeholders effectively. The Consortium Fellowship program also connects me with diverse business leaders, expanding my understanding of how quality assurance impacts different industries and markets."
      },
      {
        question: "What's your perspective on Silicon Valley testing practices vs other markets?",
        answer: "Having worked in Austin's civic tech scene and now studying in the Bay Area, I've observed that Silicon Valley companies often emphasize rapid iteration and fail-fast mentalities, which requires different QA approaches than traditional markets. Bay Area companies typically invest heavily in automation and have sophisticated CI/CD pipelines, while other markets may prioritize comprehensive manual testing. My experience across both ecosystems helps me recommend the right balance of speed and thoroughness based on company culture, risk tolerance, and market demands."
      },
      {
        question: "Are you available for UC Berkeley alumni network projects?",
        answer: "Absolutely! As a current UC Berkeley Haas MBA student and Consortium Fellow, I'm actively engaged with the alumni network and happy to work on projects that benefit the Berkeley community. Whether it's helping fellow alumni with QA challenges, contributing to Berkeley-affiliated startups, or supporting academic research that requires software testing expertise, I welcome opportunities to give back to the university and leverage our shared network for mutual benefit."
      },
      {
        question: "How do you balance Austin roots with Bay Area innovation?",
        answer: "I see this dual-location experience as a unique advantage. Austin's tech scene emphasizes community, sustainable growth, and civic impact, while the Bay Area pushes the boundaries of technological innovation and scale. I bring Austin's collaborative culture and focus on meaningful impact to Bay Area projects, while incorporating Silicon Valley's cutting-edge practices and ambitious thinking into Austin work. This cross-pollination of ideas allows me to offer clients the best of both innovation ecosystems."
      },
      {
        question: "Do you provide product management and business strategy consulting?",
        answer: "Yes! My UC Berkeley MBA education, combined with hands-on experience leading cross-functional teams, positions me to provide strategic product management and business consulting services. I help companies develop product strategies, optimize go-to-market approaches, and build high-performing teams. My unique background allows me to bridge technical execution with business strategy, ensuring that product decisions are both technically feasible and strategically sound for sustainable business growth."
      },
      {
        question: "How does your business school experience enhance your product leadership?",
        answer: "Business school has fundamentally transformed how I approach product development and team leadership. At UC Berkeley Haas, I've learned advanced frameworks for strategic thinking, financial analysis, and organizational behavior that directly apply to product management. I can now evaluate product opportunities through multiple lenses — market analysis, competitive positioning, financial modeling, and operational feasibility — while building and leading diverse teams to execute complex product initiatives."
      }
    ]
  },
  {
    category: "Connecting & Collaborating",
    badge: "Network",
    questions: [
      {
        question: "What kinds of conversations and collaborations interest you most?",
        answer: "I'm most energized by discussions that explore the intersection of technology and business strategy. I love connecting with fellow professionals working on civic tech, product innovation, quality engineering at scale, or business transformation. Whether it's sharing insights on building reliable systems, discussing MBA learnings from UC Berkeley, or exploring how Austin and Bay Area tech cultures can learn from each other, I'm always up for meaningful conversations."
      },
      {
        question: "How do you approach networking and professional relationships?",
        answer: "I believe the best professional relationships start with genuine curiosity and shared interests. I prefer conversations that focus on learning from each other's experiences rather than transactional networking. Whether we connect at a tech meetup in Austin, a business school event in Berkeley, or through shared connections, I'm most interested in building relationships based on mutual respect, shared values, and opportunities to make meaningful impact together."
      },
      {
        question: "What's your current focus as you transition to full-time MBA studies?",
        answer: "I'm focused on bridging my technical background with strategic business thinking through my MBA at UC Berkeley Haas. This means exploring how quality engineering principles apply to broader business challenges, learning from diverse classmates and faculty, and staying connected with both Austin's collaborative tech scene and the Bay Area's innovation ecosystem. I'm particularly interested in how technology can solve meaningful societal problems at scale."
      },
      {
        question: "Are you open to mentoring or knowledge sharing?",
        answer: "Absolutely! I love sharing what I've learned about QA engineering, transitioning from technical roles to business strategy, and navigating the Austin-to-Bay Area professional landscape. Whether you're an aspiring QA engineer, someone considering an MBA, or a fellow professional exploring the intersection of tech and strategy, I'm happy to share perspectives and learn from your experiences too."
      },
      {
        question: "How can we start a meaningful conversation?",
        answer: "The best way to connect is through my contact page or LinkedIn. I respond thoughtfully to messages that show genuine interest in shared topics or collaboration opportunities. Whether you want to discuss quality engineering challenges, share MBA experiences, explore Austin or Bay Area tech communities, or just exchange ideas about building impactful products, I'm always open to conversations that can benefit both of us."
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
      
      <div className="min-h-screen py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <Heading level={1} className="mb-4">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-electric-blue via-matrix-green to-cyber-teal bg-clip-text text-transparent">
                Questions
              </span>
            </Heading>
            <Paragraph size="lg" className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
              Get insights into QA engineering, business strategy, MBA experiences, 
              and how to connect for meaningful conversations about technology and impact.
            </Paragraph>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <section key={categoryIndex} className="space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <Badge variant="electric">
                    {category.badge}
                  </Badge>
                  <Heading level={2} className="text-2xl">
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
            <GlassCard className="text-center p-8 md:p-12">
              <Heading level={2} className="mb-4">
                Have More Questions?
              </Heading>
              <Paragraph className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
                Didn't find what you're looking for? I'd love to connect and share perspectives on QA engineering, 
                business strategy, or how technology can create meaningful impact. Always open to thoughtful conversations.
              </Paragraph>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <MorphButton href="/contact" variant="primary">
                  Start a Conversation
                </MorphButton>
                <MorphButton href="/blog" variant="outline">
                  Read My Insights
                </MorphButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
}