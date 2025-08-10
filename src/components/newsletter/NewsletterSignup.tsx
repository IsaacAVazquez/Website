"use client";

import { useState } from "react";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { MorphButton } from "@/components/ui/MorphButton";
import { Badge } from "@/components/ui/Badge";
import { 
  IconMail, 
  IconCheck, 
  IconAlertCircle, 
  IconLoader2,
  IconStar,
  IconBrain,
  IconCode,
  IconUsers
} from "@tabler/icons-react";

interface NewsletterSignupProps {
  variant?: 'default' | 'compact' | 'modal' | 'inline';
  title?: string;
  subtitle?: string;
  interests?: string[];
  showBenefits?: boolean;
  className?: string;
}

export function NewsletterSignup({
  variant = 'default',
  title = "Stay Updated",
  subtitle = "Get the latest insights on QA engineering, fantasy football analytics, and software development",
  interests = ['QA Engineering', 'Fantasy Football Analytics', 'Software Development', 'Testing Strategies'],
  showBenefits = true,
  className = ""
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          interests: selectedInterests,
          source: 'website'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing! Check your email for confirmation.');
        setEmail('');
        setSelectedInterests([]);
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  const benefits = [
    {
      icon: IconBrain,
      title: "Expert Insights",
      description: "Deep-dive tutorials and analysis on QA engineering best practices"
    },
    {
      icon: IconStar,
      title: "Fantasy Analytics",
      description: "Weekly player rankings, tier charts, and data-driven draft strategies"
    },
    {
      icon: IconCode,
      title: "Technical Content",
      description: "Code examples, testing frameworks, and software quality techniques"
    },
    {
      icon: IconUsers,
      title: "Community",
      description: "Join a community of QA engineers and fantasy football enthusiasts"
    }
  ];

  if (variant === 'compact') {
    return (
      <div className={`bg-slate-50/50 dark:bg-slate-800/25 rounded-lg border border-slate-200/50 dark:border-slate-700/50 p-4 ${className}`}>
        <div className="space-y-3">
          <div className="text-center">
            <Heading level={4} className="text-lg mb-1">{title}</Heading>
            <Paragraph size="sm" className="text-slate-600 dark:text-slate-400">
              {subtitle}
            </Paragraph>
          </div>
          
          {status === 'success' ? (
            <div className="text-center py-4">
              <IconCheck className="w-8 h-8 text-matrix-green mx-auto mb-2" />
              <p className="text-sm text-matrix-green font-medium">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-electric-blue focus:border-transparent text-sm"
                  disabled={status === 'loading'}
                />
              </div>
              
              <MorphButton
                type="submit"
                variant="electric"
                size="sm"
                className="w-full"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    Subscribing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <IconMail className="w-4 h-4" />
                    Subscribe
                  </span>
                )}
              </MorphButton>
              
              {status === 'error' && (
                <p className="text-sm text-error-red flex items-center gap-1">
                  <IconAlertCircle className="w-4 h-4" />
                  {message}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <GlassCard className={`p-6 md:p-8 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-electric-blue/10 rounded-full">
              <IconMail className="w-8 h-8 text-electric-blue" />
            </div>
          </div>
          <Heading level={2} className="mb-2">{title}</Heading>
          <Paragraph className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            {subtitle}
          </Paragraph>
        </div>

        {/* Benefits */}
        {showBenefits && variant === 'default' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/25 rounded-lg">
                  <Icon className="w-5 h-5 text-electric-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {status === 'success' ? (
          <div className="text-center py-8">
            <IconCheck className="w-12 h-12 text-matrix-green mx-auto mb-4" />
            <Heading level={3} className="text-matrix-green mb-2">Welcome aboard!</Heading>
            <Paragraph className="text-slate-600 dark:text-slate-400">
              {message}
            </Paragraph>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="isaac@example.com"
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-transparent transition-colors"
                disabled={status === 'loading'}
                required
              />
            </div>

            {/* Interest Selection */}
            {interests.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  What interests you? (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`transition-all duration-200 ${
                        selectedInterests.includes(interest)
                          ? 'transform scale-105'
                          : 'hover:scale-105'
                      }`}
                    >
                      <Badge
                        variant={selectedInterests.includes(interest) ? 'electric' : 'outline'}
                        size="md"
                        className="cursor-pointer"
                      >
                        {interest}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <MorphButton
              type="submit"
              variant="electric"
              size="lg"
              className="w-full"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <IconLoader2 className="w-5 h-5 animate-spin" />
                  Subscribing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <IconMail className="w-5 h-5" />
                  Subscribe to Newsletter
                </span>
              )}
            </MorphButton>

            {/* Error Message */}
            {status === 'error' && (
              <div className="p-3 bg-error-red/10 border border-error-red/20 rounded-lg">
                <p className="text-sm text-error-red flex items-center gap-2">
                  <IconAlertCircle className="w-4 h-4" />
                  {message}
                </p>
              </div>
            )}

            {/* Privacy Note */}
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              No spam, unsubscribe at any time. I respect your privacy and will never share your email.
            </p>
          </form>
        )}
      </div>
    </GlassCard>
  );
}