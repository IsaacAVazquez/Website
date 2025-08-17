"use client";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { FaLinkedin, FaEnvelope } from "react-icons/fa";
import { GlassCard } from "@/components/ui/GlassCard";
import { MorphButton } from "@/components/ui/MorphButton";

export function ContactContent() {
  return (
    <>
      {/* Page Header Banner */}
      <header role="banner" className="relative z-20 bg-gradient-to-r from-terminal-bg via-slate-900 to-terminal-bg border-b border-electric-blue/20 mb-8">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold gradient-text mb-2 font-heading">
              Contact Isaac
            </h1>
            <p className="text-slate-300 text-lg">
              Let's connect and explore opportunities together
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center mt-4 max-w-4xl mx-auto">
      <GlassCard 
        elevation={3}
        interactive={false}
        floating={true}
        cursorGlow={true}
        noiseTexture={true}
        className="text-center p-8 mb-8"
      >
        <span className="text-5xl mb-4 block animate-wiggle">🤝</span>
        <Heading className="font-heading font-black mb-4 text-3xl gradient-text">
          Let's Connect & Share Ideas
        </Heading>
        <Paragraph className="mb-6 max-w-xl text-lg text-secondary">
          I love connecting with fellow professionals, sharing insights on tech and business strategy, and exploring how technology can solve meaningful problems. Whether you're in NYC, Austin, San Fransisco and the Bay Area, or anywhere in between, I'd enjoy hearing your perspective.
        </Paragraph>
        
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <a href="mailto:isaacavazquez95@gmail.com">
            <MorphButton
              variant="primary"
              size="md"
              icon={<FaEnvelope className="text-lg" />}
              iconPosition="left"
            >
              Start a Conversation
            </MorphButton>
          </a>
          
          <a href="https://www.linkedin.com/in/isaac-vazquez" target="_blank" rel="noopener noreferrer">
            <MorphButton
              variant="secondary"
              size="md"
              icon={<FaLinkedin className="text-lg" />}
              iconPosition="left"
            >
              Connect on LinkedIn
            </MorphButton>
          </a>
        </div>
        
        <Paragraph className="text-sm text-secondary">
          Always open to meaningful conversations about technology, strategy, and building impactful solutions
        </Paragraph>
      </GlassCard>
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