import { Metadata } from 'next';
import { NewsletterSignup } from '@/components/newsletter/NewsletterSignup';
import { Heading } from '@/components/ui/Heading';
import { Paragraph } from '@/components/ui/Paragraph';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { constructMetadata } from '@/lib/seo';
import { 
  IconBrain, 
  IconTrophy, 
  IconCode, 
  IconCalendar,
  IconUsers,
  IconMail
} from '@tabler/icons-react';

export const metadata: Metadata = {
  ...constructMetadata({
    title: 'Newsletter - Isaac Vazquez',
    description: 'Subscribe to Isaac Vazquez\'s newsletter for expert insights on QA engineering, fantasy football analytics, software development, and testing strategies.',
    canonicalUrl: 'https://isaacavazquez.com/newsletter'
  }),
  robots: {
    index: false,
    follow: false
  }
};

export default function NewsletterPage() {
  const contentTypes = [
    {
      icon: IconBrain,
      title: "QA Engineering Deep Dives",
      description: "Comprehensive guides on testing strategies, automation frameworks, and quality assurance best practices",
      topics: ["Test Automation", "API Testing", "Performance Testing", "Security Testing"]
    },
    {
      icon: IconTrophy,
      title: "Fantasy Football Analytics",
      description: "Data-driven analysis, player projections, tier charts, and winning strategies for your fantasy leagues",
      topics: ["Player Rankings", "Tier Charts", "Draft Strategy", "Waiver Wire"]
    },
    {
      icon: IconCode,
      title: "Software Development",
      description: "Code quality techniques, development best practices, and technical tutorials with real examples",
      topics: ["Code Quality", "Testing Frameworks", "DevOps", "Architecture"]
    }
  ];

  const recentContent = [
    {
      title: "Complete Guide to QA Engineering",
      type: "QA Engineering",
      date: "2024-03-15",
      readTime: "25 min read"
    },
    {
      title: "Mastering Fantasy Football Analytics",
      type: "Fantasy Football",
      date: "2024-03-10",
      readTime: "20 min read"
    },
    {
      title: "Building Reliable Software Systems",
      type: "Software Quality",
      date: "2024-03-05",
      readTime: "30 min read"
    }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Newsletter - Isaac Vazquez',
    description: 'Subscribe to expert insights on QA engineering, fantasy football analytics, and software development',
    url: 'https://isaacavazquez.com/newsletter',
    author: {
      '@type': 'Person',
      name: 'Isaac Vazquez',
      jobTitle: 'QA Engineer',
      url: 'https://isaacavazquez.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Austin',
        addressRegion: 'TX',
        addressCountry: 'US'
      }
    },
    mainEntity: {
      '@type': 'Newsletter',
      name: 'Isaac Vazquez Newsletter',
      description: 'Expert insights on QA engineering, fantasy football analytics, and software development',
      publisher: {
        '@type': 'Person',
        name: 'Isaac Vazquez'
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0A0A0B] dark:via-[#0F172A] dark:to-[#1E293B]">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-electric-blue/10 rounded-full">
                  <IconMail className="w-12 h-12 text-electric-blue" />
                </div>
              </div>
              <Heading level={1} className="mb-4">
                Join the{" "}
                <span className="bg-gradient-to-r from-electric-blue via-matrix-green to-cyber-teal bg-clip-text text-transparent">
                  Newsletter
                </span>
              </Heading>
              <Paragraph size="lg" className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400">
                Get expert insights on QA engineering, fantasy football analytics, and software development 
                delivered to your inbox. Join 500+ professionals who stay ahead of the curve.
              </Paragraph>
            </div>

            {/* Newsletter Signup Form */}
            <NewsletterSignup
              title="Subscribe for Expert Insights"
              subtitle="Join a community of QA engineers, fantasy football enthusiasts, and software developers"
              interests={[
                'QA Engineering',
                'Fantasy Football Analytics', 
                'Software Development',
                'Testing Strategies',
                'Data Analysis',
                'Automation'
              ]}
              showBenefits={true}
            />

            {/* Content Types */}
            <div className="space-y-8">
              <div className="text-center">
                <Heading level={2} className="mb-4">What You'll Get</Heading>
                <Paragraph className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Deep-dive content covering the latest in quality assurance, analytics, and software development
                </Paragraph>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {contentTypes.map((content) => {
                  const Icon = content.icon;
                  return (
                    <GlassCard key={content.title} className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-electric-blue/10 rounded-lg">
                            <Icon className="w-6 h-6 text-electric-blue" />
                          </div>
                          <Heading level={3} className="text-lg">{content.title}</Heading>
                        </div>
                        
                        <Paragraph size="sm" className="text-slate-600 dark:text-slate-400">
                          {content.description}
                        </Paragraph>
                        
                        <div className="flex flex-wrap gap-1">
                          {content.topics.map((topic) => (
                            <Badge key={topic} variant="outline" size="sm">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>

            {/* Recent Content */}
            <div className="space-y-6">
              <div className="text-center">
                <Heading level={2} className="mb-4">Recent Content</Heading>
                <Paragraph className="text-slate-600 dark:text-slate-400">
                  Here's what subscribers have been reading lately
                </Paragraph>
              </div>

              <div className="space-y-4">
                {recentContent.map((item, index) => (
                  <GlassCard key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="electric" size="sm">{item.type}</Badge>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        <Heading level={4} className="text-lg">{item.title}</Heading>
                      </div>
                      <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <IconCalendar className="w-4 h-4" />
                          {item.readTime}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            <GlassCard className="p-8 text-center">
              <div className="max-w-2xl mx-auto">
                <Heading level={3} className="mb-4">
                  Join 500+ Professionals
                </Heading>
                <Paragraph className="text-slate-600 dark:text-slate-400 mb-6">
                  QA engineers, fantasy football enthusiasts, and software developers from companies like:
                </Paragraph>
                <div className="flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <IconUsers className="w-4 h-4" />
                    <span>500+ Subscribers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconMail className="w-4 h-4" />
                    <span>Weekly Insights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconBrain className="w-4 h-4" />
                    <span>Expert Analysis</span>
                  </div>
                </div>
              </div>
            </GlassCard>

          </div>
        </div>
      </main>
    </>
  );
}