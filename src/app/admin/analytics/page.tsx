import { Metadata } from 'next';
import { Heading } from '@/components/ui/Heading';
import { Paragraph } from '@/components/ui/Paragraph';
import { WarmCard } from '@/components/ui/WarmCard';
import { Badge } from '@/components/ui/Badge';
import {
  IconChartLine,
  IconClock,
  IconUsers,
  IconActivity,
  IconTarget
} from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Isaac Vazquez',
  description: 'Performance analytics and web vitals monitoring for isaacavazquez.com',
  robots: 'noindex, nofollow' // Keep analytics private
};

// This would be a real-time dashboard in production
// For now, it shows the structure and types of metrics being tracked
export default function AnalyticsDashboardPage() {
  // Sample data - in production, this would fetch from your analytics API
  const webVitals = {
    LCP: { value: 2.1, rating: 'good', samples: 142 },
    INP: { value: 89, rating: 'good', samples: 98 },
    CLS: { value: 0.08, rating: 'good', samples: 156 },
    FCP: { value: 1.6, rating: 'good', samples: 142 },
    TTFB: { value: 720, rating: 'good', samples: 142 }
  };

  const engagement = {
    totalPageViews: 1247,
    uniqueVisitors: 892,
    avgSessionDuration: '4:32',
    bounceRate: '23%',
    topPages: [
      { path: '/', views: 456, engagement: '89%' },
      { path: '/fantasy-football', views: 234, engagement: '76%' },
      { path: '/about', views: 187, engagement: '68%' },
      { path: '/projects', views: 143, engagement: '71%' },
      { path: '/blog', views: 98, engagement: '82%' }
    ]
  };

  const conversions = {
    newsletterSignups: 23,
    contactFormSubmits: 12,
    projectInquiries: 8,
    fantasyToolUsage: 156
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-[#6BCF7F]';
      case 'needs-improvement': return 'text-[#F7B32B]';
      case 'poor': return 'text-[#FF6B35]';
      default: return 'text-[#6B4F3D]';
    }
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'good': return 'success';
      case 'needs-improvement': return 'warning';
      case 'poor': return 'default';
      default: return 'default';
    }
  };

  return (
    <main className="min-h-screen bg-[#FFFCF7] dark:bg-gradient-to-br dark:from-[#1C1410] dark:via-[#2D1B12] dark:to-[#1C1410]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-[#FF6B35]/10 rounded-full">
                <IconChartLine className="w-8 h-8 text-[#FF6B35]" />
              </div>
            </div>
            <Heading level={1} className="mb-4 text-4xl md:text-5xl lg:text-6xl">
              Analytics{" "}
              <span className="gradient-text-warm">
                Dashboard
              </span>
            </Heading>
            <Paragraph className="text-[#4A3426] dark:text-[#D4A88E] max-w-2xl mx-auto">
              Real-time performance monitoring and user engagement analytics for isaacavazquez.com
            </Paragraph>
          </div>

          {/* Core Web Vitals */}
          <div className="space-y-6">
            <Heading level={2} className="text-center text-[#FF6B35]">Core Web Vitals</Heading>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(webVitals).map(([metric, data]) => (
                <WarmCard key={metric} padding="lg" className="text-center">
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <Badge variant={getRatingBadge(data.rating)} size="sm">
                        {metric}
                      </Badge>
                    </div>
                    <div className={`text-2xl font-bold ${getRatingColor(data.rating)}`}>
                      {metric === 'CLS' ? data.value.toFixed(3) :
                       metric === 'LCP' || metric === 'FCP' ? `${data.value}s` :
                       `${data.value}ms`}
                    </div>
                    <div className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">
                      {data.samples} samples
                    </div>
                    <div className="text-xs text-[#9C7A5F] dark:text-[#B89478]">
                      {data.rating.replace('-', ' ')}
                    </div>
                  </div>
                </WarmCard>
              ))}
            </div>
          </div>

          {/* Engagement Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WarmCard padding="lg">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <IconUsers className="w-6 h-6 text-[#FF6B35]" />
                  <Heading level={3} className="text-[#FF6B35]">User Engagement</Heading>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-[#FFE4D6]/30 dark:bg-[#2D1B12]/50 rounded-lg">
                    <div className="text-2xl font-bold text-[#FF6B35]">{engagement.totalPageViews.toLocaleString()}</div>
                    <div className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Page Views</div>
                  </div>
                  <div className="text-center p-4 bg-[#FFE4D6]/30 dark:bg-[#2D1B12]/50 rounded-lg">
                    <div className="text-2xl font-bold text-[#6BCF7F]">{engagement.uniqueVisitors.toLocaleString()}</div>
                    <div className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Unique Visitors</div>
                  </div>
                  <div className="text-center p-4 bg-[#FFE4D6]/30 dark:bg-[#2D1B12]/50 rounded-lg">
                    <div className="text-2xl font-bold text-[#FF8E53]">{engagement.avgSessionDuration}</div>
                    <div className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Avg Session</div>
                  </div>
                  <div className="text-center p-4 bg-[#FFE4D6]/30 dark:bg-[#2D1B12]/50 rounded-lg">
                    <div className="text-2xl font-bold text-[#F7B32B]">{engagement.bounceRate}</div>
                    <div className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Bounce Rate</div>
                  </div>
                </div>
              </div>
            </WarmCard>

            <WarmCard padding="lg">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <IconTarget className="w-6 h-6 text-[#6BCF7F]" />
                  <Heading level={3} className="text-[#FF6B35]">Conversions</Heading>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-[#FFE4D6]/30 dark:bg-[#2D1B12]/50 rounded-lg">
                    <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Newsletter Signups</span>
                    <span className="font-bold text-[#FF6B35]">{conversions.newsletterSignups}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#FFE4D6]/30 dark:bg-[#2D1B12]/50 rounded-lg">
                    <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Contact Forms</span>
                    <span className="font-bold text-[#6BCF7F]">{conversions.contactFormSubmits}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#FFE4D6]/30 dark:bg-[#2D1B12]/50 rounded-lg">
                    <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Project Inquiries</span>
                    <span className="font-bold text-[#FF8E53]">{conversions.projectInquiries}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#FFE4D6]/30 dark:bg-[#2D1B12]/50 rounded-lg">
                    <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Fantasy Tool Usage</span>
                    <span className="font-bold text-[#F7B32B]">{conversions.fantasyToolUsage}</span>
                  </div>
                </div>
              </div>
            </WarmCard>
          </div>

          {/* Top Pages */}
          <WarmCard padding="lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <IconActivity className="w-6 h-6 text-[#FF6B35]" />
                <Heading level={3} className="text-[#FF6B35]">Top Pages</Heading>
              </div>
              <div className="space-y-2">
                {engagement.topPages.map((page, index) => (
                  <div key={page.path} className="flex items-center justify-between p-3 bg-[#FFE4D6]/30 dark:bg-[#2D1B12]/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-[#FF6B35]/20 text-[#FF6B35] rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-[#4A3426] dark:text-[#FFE4D6]">{page.path}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[#6B4F3D] dark:text-[#D4A88E]">{page.views} views</span>
                      <Badge variant="success" size="sm">{page.engagement}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </WarmCard>

          {/* Performance Notes */}
          <WarmCard padding="lg" className="bg-gradient-to-r from-[#6BCF7F]/5 to-[#FF6B35]/5">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <IconClock className="w-6 h-6 text-[#6BCF7F]" />
                <Heading level={3} className="text-[#FF6B35]">Performance Status</Heading>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Heading level={4} className="text-[#6BCF7F] mb-2">✅ Excellent Performance</Heading>
                  <ul className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] space-y-1">
                    <li>• All Core Web Vitals in "Good" range</li>
                    <li>• Fast loading times across all pages</li>
                    <li>• Minimal layout shift (CLS: 0.08)</li>
                    <li>• Quick user interaction response</li>
                  </ul>
                </div>
                <div>
                  <Heading level={4} className="text-[#FF6B35] mb-2">📊 Monitoring</Heading>
                  <ul className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] space-y-1">
                    <li>• Real-time Web Vitals collection</li>
                    <li>• User engagement tracking</li>
                    <li>• Conversion funnel monitoring</li>
                    <li>• Error tracking and reporting</li>
                  </ul>
                </div>
              </div>
            </div>
          </WarmCard>

        </div>
      </div>
    </main>
  );
}