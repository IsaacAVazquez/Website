"use client";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { FaLinkedin, FaEnvelope, FaCalendar, FaRocket } from "react-icons/fa";
import { GlassCard } from "@/components/ui/GlassCard";
import { MorphButton } from "@/components/ui/MorphButton";

export function ContactContent() {
  return (
    <>
      {/* Page Header Banner */}
      <header role="banner" className="relative z-20 bg-gradient-to-r from-terminal-bg via-slate-900 to-terminal-bg border-b border-electric-blue/20 mb-8">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold gradient-text mb-2 font-heading">
              Let's Build Something Great Together
            </h1>
            <p className="text-slate-300 text-lg content-text">
              Available for product management opportunities, consulting projects, and strategic conversations
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center mt-4 max-w-6xl mx-auto space-y-8">
        {/* Primary CTA Card */}
        <GlassCard
          elevation={4}
          interactive={false}
          floating={true}
          cursorGlow={true}
          noiseTexture={true}
          className="text-center p-8 w-full"
          ariaLabel="Primary contact options"
        >
          <span className="text-5xl mb-4 block animate-wiggle" aria-hidden="true">🚀</span>
          <Heading className="font-heading font-black mb-4 text-3xl gradient-text">
            Ready to Connect?
          </Heading>
          <Paragraph className="mb-6 max-w-2xl mx-auto text-lg text-secondary content-text">
            I'm actively seeking product management roles where I can leverage my technical foundation and UC Berkeley MBA education to drive product strategy and execution. I'm also open to consulting opportunities and always happy to chat about technology, business strategy, and building impactful products.
          </Paragraph>

          {/* Strategic CTA Placement - 2025 Best Practices */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            {/* Primary CTA - Most important action */}
            <a href="mailto:isaacavazquez95@gmail.com" className="group">
              <MorphButton
                variant="primary"
                size="lg"
                icon={<FaEnvelope className="text-lg" />}
                iconPosition="left"
                ariaLabel="Send me an email"
                className="hover-lift"
              >
                Email Me — I Reply Within 24 Hours
              </MorphButton>
            </a>

            {/* Secondary CTA */}
            <a href="https://www.linkedin.com/in/isaac-vazquez" target="_blank" rel="noopener noreferrer" className="group">
              <MorphButton
                variant="secondary"
                size="lg"
                icon={<FaLinkedin className="text-lg" />}
                iconPosition="left"
                ariaLabel="Connect with me on LinkedIn"
                className="hover-lift"
              >
                Connect on LinkedIn
              </MorphButton>
            </a>
          </div>

          {/* Trust Badge / Friction Reducer */}
          <div className="flex items-center justify-center gap-2 text-sm text-matrix-green">
            <div className="w-2 h-2 bg-matrix-green rounded-full animate-pulse" aria-hidden="true"></div>
            <span>Quick response guaranteed • No commitment required • Open to all opportunities</span>
          </div>
        </GlassCard>

        {/* Value Proposition Cards - Social Proof */}
        <div className="grid md:grid-cols-3 gap-6 w-full">
          <GlassCard
            elevation={2}
            interactive={true}
            className="p-6 text-center hover-lift"
            ariaLabel="Product management expertise"
          >
            <div className="text-3xl mb-3" aria-hidden="true">💼</div>
            <Heading className="text-lg font-bold mb-2 text-electric-blue">
              Product Leadership
            </Heading>
            <Paragraph className="text-sm text-secondary">
              Technical foundation + MBA strategy + 6+ years building products at scale
            </Paragraph>
          </GlassCard>

          <GlassCard
            elevation={2}
            interactive={true}
            className="p-6 text-center hover-lift"
            ariaLabel="Proven track record"
          >
            <div className="text-3xl mb-3" aria-hidden="true">📊</div>
            <Heading className="text-lg font-bold mb-2 text-matrix-green">
              Proven Results
            </Heading>
            <Paragraph className="text-sm text-secondary">
              60M+ users served • 99.9% uptime • 50% defect reduction across multiple products
            </Paragraph>
          </GlassCard>

          <GlassCard
            elevation={2}
            interactive={true}
            className="p-6 text-center hover-lift"
            ariaLabel="Fast response time"
          >
            <div className="text-3xl mb-3" aria-hidden="true">⚡</div>
            <Heading className="text-lg font-bold mb-2 text-cyber-teal">
              Quick Responder
            </Heading>
            <Paragraph className="text-sm text-secondary">
              I reply to all messages within 24 hours and am open to calls, coffee chats, or video meetings
            </Paragraph>
          </GlassCard>
        </div>

        {/* Locations & Availability */}
        <GlassCard
          elevation={2}
          className="p-6 w-full"
          ariaLabel="Location and availability information"
        >
          <div className="text-center">
            <Heading className="text-xl font-bold mb-4 text-gradient">
              📍 Based in Austin, TX • Open to Remote & Relocation
            </Heading>
            <Paragraph className="text-secondary content-text max-w-2xl mx-auto">
              Currently completing my MBA at UC Berkeley Haas (expected graduation May 2025).
              Available for immediate start for the right opportunity. Open to roles in San Francisco,
              Austin, NYC, or remote positions with mission-driven companies.
            </Paragraph>
          </div>
        </GlassCard>
      </div>
      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-10deg) scale(1);}
          25% { transform: rotate(8deg) scale(1.08);}
          50% { transform: rotate(-4deg) scale(1);}
          75% { transform: rotate(10deg) scale(1.05);}
        }
        .animate-wiggle {
          animation: wiggle 2.5s infinite;
        }
      `}</style>
    </div>
    </>
  );
}