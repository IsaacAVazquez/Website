"use client";

import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { NewsletterSignup } from "./NewsletterSignup";
import { IconMail, IconArrowRight, IconStar } from "@tabler/icons-react";

interface NewsletterCTAProps {
  variant?: 'embedded' | 'banner' | 'modal' | 'sidebar';
  title?: string;
  subtitle?: string;
  showSignupForm?: boolean;
  interests?: string[];
  className?: string;
}

export function NewsletterCTA({
  variant = 'embedded',
  title = "Don't Miss Out",
  subtitle = "Get expert insights delivered to your inbox",
  showSignupForm = false,
  interests = [],
  className = ""
}: NewsletterCTAProps) {

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-electric-blue/10 via-matrix-green/10 to-cyber-teal/10 border-y border-electric-blue/20 ${className}`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-electric-blue/20 rounded-full">
                <IconMail className="w-6 h-6 text-electric-blue" />
              </div>
              <div>
                <Heading level={4} className="text-lg mb-1">{title}</Heading>
                <Paragraph size="sm" className="text-slate-600 dark:text-slate-400">
                  {subtitle}
                </Paragraph>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <IconStar className="w-4 h-4 text-warning-amber" />
                <span>500+ subscribers</span>
              </div>
              <Link href="/newsletter">
                <ModernButton variant="electric" size="md">
                  <span className="flex items-center gap-2">
                    Subscribe Now
                    <IconArrowRight className="w-4 h-4" />
                  </span>
                </ModernButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`sticky top-8 ${className}`}>
        <NewsletterSignup
          variant="compact"
          title={title}
          subtitle={subtitle}
          interests={interests}
          showBenefits={false}
        />
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className}`}>
        <div className="max-w-md w-full">
          <NewsletterSignup
            title={title}
            subtitle={subtitle}
            interests={interests}
            showBenefits={false}
          />
        </div>
      </div>
    );
  }

  // Default embedded variant
  if (showSignupForm) {
    return (
      <div className={className}>
        <NewsletterSignup
          title={title}
          subtitle={subtitle}
          interests={interests}
          showBenefits={false}
        />
      </div>
    );
  }

  return (
    <WarmCard hover={false} padding="md" className={`p-6 md:p-8 text-center ${className}`}>
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-electric-blue/10 rounded-full">
            <IconMail className="w-8 h-8 text-electric-blue" />
          </div>
        </div>
        
        <div>
          <Heading level={3} className="mb-2">{title}</Heading>
          <Paragraph className="text-slate-600 dark:text-slate-400">
            {subtitle}
          </Paragraph>
        </div>

        <div className="space-y-3">
          <Link href="/newsletter">
            <ModernButton variant="electric" size="lg" className="w-full">
              <span className="flex items-center gap-2">
                <IconMail className="w-5 h-5" />
                Subscribe to Newsletter
              </span>
            </ModernButton>
          </Link>
          
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <IconStar className="w-4 h-4 text-warning-amber" />
              <span>500+ subscribers</span>
            </div>
            <span>•</span>
            <span>Weekly insights</span>
            <span>•</span>
            <span>No spam</span>
          </div>
        </div>
      </div>
    </WarmCard>
  );
}

// Hook for newsletter modal functionality
export function useNewsletterModal() {
  // This could be expanded to include:
  // - Exit intent detection
  // - Scroll percentage triggers
  // - Time-based triggers
  // - Local storage to prevent showing multiple times
  
  return {
    showModal: false, // Would be controlled by state
    hideModal: () => {}, // Function to hide modal
    triggerModal: () => {} // Function to show modal
  };
}