import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Paragraph } from "@/components/Paragraph";
import Image from "next/image";

export default function Home() {
  return (
    <Container className="max-w-2xl mx-auto px-6 py-12 bg-white rounded-lg shadow-lg">
      <div className="flex items-center mb-8">
        <span className="text-5xl mr-4">💼</span>
        <div>
          <Heading className="font-extrabold text-3xl mb-1 tracking-tight text-gray-900">
            Isaac Vazquez
          </Heading>
          <div className="flex flex-wrap items-center text-gray-600 text-sm space-x-4">
            <a
              href="mailto:isaacvazquez@mba.berkeley.edu"
              className="underline hover:text-blue-600"
            >
              isaacvazquez@mba.berkeley.edu
            </a>
            <span>&bull;</span>
            <a
              href="https://linkedin.com/in/isaac-vazquez"
              className="underline hover:text-blue-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      <Paragraph className="mb-8 text-gray-700 text-lg">
        <span className="block font-medium text-gray-800">
          Consortium Fellow, MBA Candidate at Berkeley Haas
        </span>
        <span className="block">
          QA Engineer with a record of advancing product quality, release velocity, and cross-functional team collaboration in high-growth tech and civic engagement organizations.
        </span>
      </Paragraph>

      <section className="mb-8">
        <Heading level={2} className="text-xl font-semibold mb-3 text-blue-900">
          Education
        </Heading>
        <div className="space-y-2">
          <Paragraph className="mb-0">
            <span className="font-bold text-gray-900">University of California, Berkeley – Haas School of Business</span>
            <br />
            <span className="text-gray-700">Master of Business Administration, Consortium Fellow (May 2027)</span>
          </Paragraph>
          <Paragraph className="mb-0">
            <span className="font-bold text-gray-900">Florida State University</span>
            <br />
            <span className="text-gray-700">B.A., Political Science and International Affairs, magna cum laude (Dec 2018)</span>
          </Paragraph>
        </div>
      </section>

      <section className="mb-8">
        <Heading level={2} className="text-xl font-semibold mb-3 text-blue-900">
          Experience
        </Heading>
        <div className="space-y-6">
          <div>
            <Heading level={3} className="font-bold text-gray-800">
              Civitech, Austin, TX
            </Heading>
            <Paragraph className="mb-1">
              <span className="font-semibold text-gray-900">Quality Assurance Engineer</span> <span className="text-gray-500">(Feb 2025–Present)</span>
              <br />
              Orchestrated release-governance framework integrating QA, DevOps, and Security workflows—cutting critical production defects by 50% quarter over quarter. Designed unified automation framework, enabling same-day validation of releases and faster stakeholder sign-off. Represented QA in sprint reviews and backlog refinement, driving quality criteria and on-time launches.
            </Paragraph>
            <Paragraph>
              <span className="font-semibold text-gray-900">Quality Assurance Analyst</span> <span className="text-gray-500">(Jan 2022–Jan 2025)</span>
              <br />
              Directed scalable QA strategies for multiple products, increasing release efficiency by 30% and achieving near 100% uptime. Executed 400+ manual and automated tests with JMeter, Postman, and Cypress, and used data insights to boost user engagement for outreach to 60M+ voters.
            </Paragraph>
          </div>
          <div>
            <Heading level={3} className="font-bold text-gray-800">
              Open Progress, Los Angeles, CA
            </Heading>
            <Paragraph className="mb-1">
              <span className="font-semibold text-gray-900">Client Services Manager</span> <span className="text-gray-500">(Jan 2021–Dec 2021)</span>
              <br />
              Led digital voter engagement campaigns for 80+ programs, achieving 100% on-time delivery and driving 40M+ voter conversations.
            </Paragraph>
            <Paragraph className="mb-1">
              <span className="font-semibold text-gray-900">Digital & Data Associate</span> <span className="text-gray-500">(Sep 2019–Dec 2020)</span>
              <br />
              Developed campaign dashboards and analytics for 20+ clients, improving decision speed by 40% and optimizing engagement strategy.
            </Paragraph>
            <Paragraph>
              <span className="font-semibold text-gray-900">Digital & Communications Intern</span> <span className="text-gray-500">(Jun 2019–Aug 2019)</span>
              <br />
              Enhanced email targeting and performance monitoring, boosting client fundraising list growth by 500%.
            </Paragraph>
          </div>
        </div>
      </section>

      <section>
        <Heading level={2} className="text-xl font-semibold mb-3 text-blue-900">
          Additional
        </Heading>
        <Paragraph className="mb-2 text-gray-700">
          MLT MBA Professional Development Fellow, Consortium Fellow, MBA Prep Ambassador.
        </Paragraph>
        <Paragraph className="text-gray-700">
          <span className="font-bold text-gray-900">Skills:</span> A/B Testing, Agile/Scrum, Charting & Data Visualization, Cypress, Data Analysis, Figma, JavaScript, Jira, JMeter, Postman, Product Analytics, Product Roadmapping, SQL, Stakeholder Management, Tableau, User Research
        </Paragraph>
      </section>
    </Container>
  );
}
