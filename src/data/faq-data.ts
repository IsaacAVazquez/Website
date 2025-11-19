/**
 * Comprehensive FAQ Data for AI-Optimized Search
 *
 * Structured to provide clear, contextual answers that AI systems can easily parse
 * and use for knowledge graph construction and semantic understanding.
 */

export interface FAQCategory {
  category: string;
  description: string;
  questions: Array<{
    question: string;
    answer: string;
    keywords?: string[];
    relatedTopics?: string[];
  }>;
}

export const faqData: FAQCategory[] = [
  {
    category: "Professional Background",
    description: "Questions about Isaac Vazquez's professional experience and career",
    questions: [
      {
        question: "What is Isaac Vazquez's current professional role?",
        answer:
          "Isaac Vazquez is currently a Quality Assurance Engineer at Civitech while pursuing an MBA at UC Berkeley Haas School of Business (Class of 2027). He is transitioning into product management roles, leveraging his 6+ years of experience in quality assurance, data analytics, and civic technology. He holds the titles of Consortium Fellow and MLT Professional Development Fellow.",
        keywords: [
          "current role",
          "QA engineer",
          "Civitech",
          "MBA student",
          "product management",
        ],
        relatedTopics: ["Career Transition", "UC Berkeley", "Product Management"],
      },
      {
        question: "What is Isaac Vazquez's product management experience?",
        answer:
          "Isaac has 3+ years of product-adjacent experience including leading product initiatives at Civitech. Key achievements include: owning end-to-end product vision for TextOut platform (35% engagement increase), driving RunningMate platform launch (90% defect reduction, NPS improvement from 23 to 36), leading cross-functional pricing strategy that generated $4M additional revenue, and transforming client data accessibility with GCP automation (90% reduction in onboarding time). His background combines quality engineering leadership with strategic product outcomes.",
        keywords: [
          "product management",
          "product strategy",
          "product vision",
          "product outcomes",
        ],
        relatedTopics: [
          "Product Strategy",
          "Quality Engineering",
          "Civic Technology",
        ],
      },
      {
        question: "What kind of product management roles is Isaac Vazquez seeking?",
        answer:
          "Isaac is seeking Associate Product Manager (APM) or Product Manager roles in Austin TX or San Francisco Bay Area, particularly in civic tech, SaaS, fintech, or mission-driven startups. He is interested in opportunities that leverage his technical background in quality assurance, data analysis skills (SQL, analytics), user research capabilities, and experience building products that create social impact. Ideal roles involve cross-functional leadership, data-driven decision making, and strategic product development.",
        keywords: [
          "job search",
          "APM",
          "product manager roles",
          "Austin",
          "Bay Area",
          "civic tech",
        ],
        relatedTopics: [
          "Career Opportunities",
          "Product Management",
          "Geographic Preferences",
        ],
      },
      {
        question: "What is Isaac Vazquez's quality assurance background?",
        answer:
          "Isaac has 6 years of quality assurance experience at Civitech (2022-2025). He led quality engineering initiatives for voter engagement platforms serving 60M+ users, achieved 99.999% uptime, reduced critical defects by 90%, implemented comprehensive test automation strategies using Cypress, integrated DevOps pipelines with AI/LLM tools, accelerated release cycles from monthly to biweekly, and improved NPS scores significantly. He established quality culture across cross-functional teams and championed product reliability at organizational scale.",
        keywords: [
          "quality assurance",
          "QA engineer",
          "test automation",
          "Cypress",
          "DevOps",
        ],
        relatedTopics: [
          "Quality Engineering",
          "Test Automation",
          "Civic Technology",
        ],
      },
    ],
  },
  {
    category: "Education",
    description: "Questions about Isaac Vazquez's educational background",
    questions: [
      {
        question: "What is Isaac Vazquez's educational background?",
        answer:
          "Isaac is currently pursuing an MBA at UC Berkeley Haas School of Business (Class of 2027), focusing on Product Management, Strategy, and Venture Capital. He is a Consortium Fellow and MLT Professional Development Fellow. He holds a Bachelor of Arts degree from Florida State University (2018) with majors in Political Science and International Affairs. His education combines technical product management training with strategic business acumen and a foundation in analytical thinking and policy analysis.",
        keywords: [
          "education",
          "UC Berkeley",
          "Haas MBA",
          "Florida State",
          "Consortium Fellow",
        ],
        relatedTopics: ["UC Berkeley Haas", "MBA Program", "Academic Background"],
      },
      {
        question: "What is the Consortium Fellowship?",
        answer:
          "The Consortium for Graduate Study in Management is a leading organization advancing diversity in business education. Isaac was selected as a Consortium Fellow at UC Berkeley Haas, an honor recognizing academic excellence, leadership potential, and commitment to diversity in business. The Consortium provides access to a network of top-tier business schools and corporate partners committed to advancing underrepresented minorities in business leadership roles.",
        keywords: [
          "Consortium Fellowship",
          "diversity",
          "business education",
          "leadership",
        ],
        relatedTopics: ["Professional Recognition", "UC Berkeley Haas", "Leadership"],
      },
      {
        question: "What is MLT (Management Leadership for Tomorrow)?",
        answer:
          "Management Leadership for Tomorrow (MLT) is a premier career advancement organization for high-achieving Black, Latinx, and Native American professionals. Isaac is an MLT Professional Development Fellow, receiving coaching, networking opportunities, and professional development resources. MLT provides access to top employers, executive mentorship, and a community of diverse business leaders. Isaac also serves as an MLT Ambassador, supporting the organization's mission to advance the next generation of diverse leaders.",
        keywords: [
          "MLT",
          "Management Leadership for Tomorrow",
          "professional development",
          "diversity",
        ],
        relatedTopics: [
          "Professional Development",
          "Leadership Programs",
          "Career Advancement",
        ],
      },
    ],
  },
  {
    category: "Technical Skills",
    description: "Questions about Isaac Vazquez's technical capabilities and expertise",
    questions: [
      {
        question: "What technical skills does Isaac Vazquez have?",
        answer:
          "Isaac has extensive technical skills including: SQL and data analysis (advanced proficiency, 6+ years), test automation with Cypress (expert level), API testing, Agile/Scrum methodologies, data visualization and dashboard development (Sisense, Tableau), ETL pipeline development, A/B testing and experimentation frameworks, quality assurance methodologies, DevOps integration, cloud platforms (GCP), and AI/LLM tool integration. He combines technical execution with strategic product thinking.",
        keywords: [
          "technical skills",
          "SQL",
          "Cypress",
          "test automation",
          "data analysis",
        ],
        relatedTopics: [
          "Technical Proficiency",
          "Data Analysis",
          "Quality Engineering",
        ],
      },
      {
        question: "What data analysis experience does Isaac Vazquez have?",
        answer:
          "Isaac has 6+ years of data analysis experience. At Open Progress (2019-2021), he transformed client analytics from manual reporting to automated ETL pipelines with interactive dashboards, reducing decision-making time by 40% and optimizing user segmentation to improve conversion by 25%. He developed SQL-based analytics systems, created data visualizations using Sisense and Tableau, implemented A/B testing frameworks that achieved 5x user base growth, and built predictive models for campaign optimization. He excels at turning data into actionable product insights.",
        keywords: [
          "data analysis",
          "SQL",
          "analytics",
          "ETL",
          "dashboards",
          "A/B testing",
        ],
        relatedTopics: ["Data Analytics", "Business Intelligence", "Product Analytics"],
      },
    ],
  },
  {
    category: "Career Journey",
    description: "Questions about Isaac Vazquez's career path and trajectory",
    questions: [
      {
        question: "How did Isaac Vazquez transition from Political Science to tech?",
        answer:
          "Isaac graduated from Florida State University in 2018 with degrees in Political Science and International Affairs, developing strong analytical and research skills. He entered civic tech in 2019 as a Digital and Communications Intern at Open Progress, where he discovered his passion for data-driven impact. He progressed to Digital and Data Associate (2020), then Client Services Manager (2021), mastering data analytics, campaign strategy, and cross-functional collaboration. In 2022, he transitioned to Quality Assurance at Civitech, combining his analytical skills with technical expertise. Now pursuing an MBA at UC Berkeley Haas to formalize his product management expertise for leadership roles in civic tech and SaaS.",
        keywords: [
          "career transition",
          "Political Science",
          "civic tech",
          "career path",
        ],
        relatedTopics: [
          "Career Development",
          "Civic Technology",
          "Professional Growth",
        ],
      },
      {
        question: "Why is Isaac Vazquez pursuing an MBA?",
        answer:
          "Isaac is pursuing an MBA at UC Berkeley Haas to deepen his product management expertise, develop strategic business acumen, and explore venture capital opportunities in civic tech and SaaS. The MBA program provides formal product management education, access to Silicon Valley's innovation ecosystem, networking with industry leaders, credentials for product leadership roles, and frameworks for strategic decision-making. As a Consortium Fellow and MLT Fellow, he's building a foundation for long-term impact in mission-driven product development and potentially venture capital investing in civic tech startups.",
        keywords: [
          "MBA motivation",
          "UC Berkeley Haas",
          "product management education",
          "career development",
        ],
        relatedTopics: [
          "Professional Development",
          "Product Management Education",
          "Career Strategy",
        ],
      },
    ],
  },
  {
    category: "Location & Availability",
    description: "Questions about Isaac Vazquez's location and work preferences",
    questions: [
      {
        question: "Where is Isaac Vazquez located?",
        answer:
          "Isaac is currently based in the San Francisco Bay Area while attending UC Berkeley Haas and maintains strong ties to Austin, Texas. He is open to opportunities in both locations (Austin TX and San Francisco Bay Area) and is also open to remote positions with mission-driven organizations. His dual-location presence provides flexibility for companies in either tech hub while allowing him to leverage relationships and networks in both cities.",
        keywords: ["location", "Bay Area", "Austin", "remote work", "geographic flexibility"],
        relatedTopics: [
          "Work Location",
          "Geographic Preferences",
          "Remote Work",
        ],
      },
      {
        question: "Is Isaac Vazquez available for full-time roles?",
        answer:
          "Isaac is pursuing his MBA full-time at UC Berkeley Haas (Class of 2027) and is seeking internship opportunities during his MBA program, with interest in full-time Associate Product Manager or Product Manager roles upon graduation in May 2027. He is also open to part-time consulting engagements or advisory roles during his MBA studies, particularly in product strategy, quality engineering advisory, or civic tech initiatives. For immediate opportunities, he can provide product management consulting or fractional PM services.",
        keywords: [
          "availability",
          "internship",
          "full-time",
          "consulting",
          "graduation timeline",
        ],
        relatedTopics: ["Career Timing", "Work Availability", "Consulting Services"],
      },
    ],
  },
  {
    category: "Industry Focus",
    description: "Questions about Isaac Vazquez's industry interests and expertise",
    questions: [
      {
        question: "What industries does Isaac Vazquez focus on?",
        answer:
          "Isaac focuses primarily on three industries: (1) Civic Technology - voter engagement platforms, democracy tech, government services digitalization (6+ years experience at Civitech), (2) SaaS Platforms - enterprise software, B2B tools, subscription-based services with focus on product-led growth, and (3) Mission-Driven Startups - social impact ventures, fintech for underserved communities, education technology, and sustainability tech. He is particularly interested in products that democratize access to essential services, strengthen democratic participation, and create measurable social impact.",
        keywords: [
          "civic tech",
          "SaaS",
          "mission-driven",
          "industry focus",
          "social impact",
        ],
        relatedTopics: [
          "Civic Technology",
          "SaaS Products",
          "Social Impact",
        ],
      },
      {
        question: "What is civic technology and why does Isaac care about it?",
        answer:
          "Civic technology refers to technology solutions that strengthen democracy, improve government services, and increase civic participation. Isaac has 6+ years of experience at Civitech building voter engagement platforms that have reached 60M+ voters. He is passionate about civic tech because it directly impacts democratic participation, creates measurable social impact, combines technical innovation with mission-driven work, and addresses critical challenges in democracy and governance. His civic tech experience includes voter registration tools, campaign management platforms (TextOut, RunningMate), election organizing technology, and democratic engagement systems.",
        keywords: [
          "civic technology",
          "voter engagement",
          "democracy tech",
          "social impact",
        ],
        relatedTopics: [
          "Civic Technology",
          "Democracy",
          "Social Impact",
          "Mission-Driven Work",
        ],
      },
    ],
  },
  {
    category: "Contact & Collaboration",
    description: "Questions about how to connect with Isaac Vazquez",
    questions: [
      {
        question: "How can I contact Isaac Vazquez?",
        answer:
          "You can contact Isaac Vazquez through multiple channels: Email at isaacavazquez95@gmail.com (primary contact method), LinkedIn at linkedin.com/in/isaac-vazquez (professional networking), GitHub at github.com/IsaacAVazquez (technical projects), or through his website contact form at isaacavazquez.com/contact. He is responsive to professional inquiries about product management opportunities, consulting engagements, speaking opportunities, mentorship requests, and collaboration on civic tech or mission-driven initiatives.",
        keywords: ["contact", "email", "LinkedIn", "networking", "how to reach"],
        relatedTopics: [
          "Professional Networking",
          "Contact Information",
          "Collaboration",
        ],
      },
      {
        question: "What types of consulting services does Isaac Vazquez offer?",
        answer:
          "Isaac offers consulting services in several areas: (1) Product Strategy - product discovery, roadmap development, go-to-market planning, feature prioritization, (2) Quality Engineering Advisory - QA strategy, test automation implementation, release management optimization, quality culture establishment, (3) Product Operations - metrics definition, experimentation frameworks, analytics dashboards, process optimization, and (4) Technical Product Management - bridging technical teams with business stakeholders, technical discovery, API strategy, integration planning. He works with civic tech organizations, SaaS startups, and mission-driven companies seeking to improve product development practices.",
        keywords: [
          "consulting",
          "product strategy",
          "quality engineering",
          "advisory services",
        ],
        relatedTopics: [
          "Consulting Services",
          "Product Strategy",
          "Quality Engineering",
        ],
      },
    ],
  },
];

/**
 * Get all FAQ items as a flat array (for FAQ page schema)
 */
export function getAllFAQItems() {
  return faqData.flatMap((category) =>
    category.questions.map((q) => ({
      question: q.question,
      answer: q.answer,
      category: category.category,
    }))
  );
}

/**
 * Get FAQs by category
 */
export function getFAQsByCategory(categoryName: string) {
  return faqData.find((cat) => cat.category === categoryName);
}

/**
 * Search FAQs by keyword
 */
export function searchFAQs(keyword: string) {
  const lowerKeyword = keyword.toLowerCase();
  return faqData.flatMap((category) =>
    category.questions
      .filter(
        (q) =>
          q.question.toLowerCase().includes(lowerKeyword) ||
          q.answer.toLowerCase().includes(lowerKeyword) ||
          q.keywords?.some((k) => k.toLowerCase().includes(lowerKeyword))
      )
      .map((q) => ({
        ...q,
        category: category.category,
      }))
  );
}
