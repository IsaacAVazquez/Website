import { Metadata } from 'next';
import { Heading } from '@/components/ui/Heading';
import { Paragraph } from '@/components/ui/Paragraph';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { 
  IconChartLine, 
  IconClock, 
  IconUsers, 
  IconMouse,
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
      case 'good': return 'text-matrix-green';
      case 'needs-improvement': return 'text-warning-amber';
      case 'poor': return 'text-error-red';
      default: return 'text-slate-600';
    }
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'good': return 'matrix';
      case 'needs-improvement': return 'outline';
      case 'poor': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-electric-blue/10 rounded-full">
                <IconChartLine className="w-8 h-8 text-electric-blue" />
              </div>
            </div>
            <Heading level={1} className="mb-4">
              Analytics{" "}
              <span className="bg-gradient-to-r from-electric-blue via-matrix-green to-cyber-teal bg-clip-text text-transparent">
                Dashboard
              </span>
            </Heading>
            <Paragraph className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Real-time performance monitoring and user engagement analytics for isaacavazquez.com
            </Paragraph>
          </div>

          {/* Core Web Vitals */}
          <div className="space-y-6">
            <Heading level={2} className="text-center">Core Web Vitals</Heading>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(webVitals).map(([metric, data]) => (
                <GlassCard key={metric} className="p-6 text-center">
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
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {data.samples} samples
                    </div>
                    <div className="text-xs text-slate-400">
                      {data.rating.replace('-', ' ')}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Engagement Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <IconUsers className="w-6 h-6 text-electric-blue" />
                  <Heading level={3}>User Engagement</Heading>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg">
                    <div className="text-2xl font-bold text-electric-blue">{engagement.totalPageViews.toLocaleString()}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Page Views</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg">
                    <div className="text-2xl font-bold text-matrix-green">{engagement.uniqueVisitors.toLocaleString()}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Unique Visitors</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg">
                    <div className="text-2xl font-bold text-cyber-teal">{engagement.avgSessionDuration}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Avg Session</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg">
                    <div className="text-2xl font-bold text-warning-amber">{engagement.bounceRate}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Bounce Rate</div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <IconTarget className="w-6 h-6 text-matrix-green" />
                  <Heading level={3}>Conversions</Heading>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Newsletter Signups</span>
                    <span className="font-bold text-electric-blue">{conversions.newsletterSignups}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Contact Forms</span>
                    <span className="font-bold text-matrix-green">{conversions.contactFormSubmits}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Project Inquiries</span>
                    <span className="font-bold text-cyber-teal">{conversions.projectInquiries}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Fantasy Tool Usage</span>
                    <span className="font-bold text-warning-amber">{conversions.fantasyToolUsage}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Top Pages */}
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <IconActivity className="w-6 h-6 text-electric-blue" />
                <Heading level={3}>Top Pages</Heading>
              </div>
              <div className="space-y-2">
                {engagement.topPages.map((page, index) => (
                  <div key={page.path} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-electric-blue/20 text-electric-blue rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{page.path}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{page.views} views</span>
                      <Badge variant="matrix" size="sm">{page.engagement}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Performance Notes */}
          <GlassCard className="p-6 bg-gradient-to-r from-matrix-green/5 to-electric-blue/5">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <IconClock className="w-6 h-6 text-matrix-green" />
                <Heading level={3}>Performance Status</Heading>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Heading level={4} className="text-matrix-green mb-2">✅ Excellent Performance</Heading>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• All Core Web Vitals in "Good" range</li>
                    <li>• Fast loading times across all pages</li>
                    <li>• Minimal layout shift (CLS: 0.08)</li>
                    <li>• Quick user interaction response</li>
                  </ul>
                </div>
                <div>
                  <Heading level={4} className="text-electric-blue mb-2">📊 Monitoring</Heading>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• Real-time Web Vitals collection</li>
                    <li>• User engagement tracking</li>
                    <li>• Conversion funnel monitoring</li>
                    <li>• Error tracking and reporting</li>
                  </ul>
                </div>
              </div>
            </div>
          </GlassCard>

        </div>
      </div>
    </main>
  );
}