"use client";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { FaLinkedin, FaEnvelope } from "react-icons/fa";
import { GlassCard } from "@/components/ui/GlassCard";
import { MorphButton } from "@/components/ui/MorphButton";

export function ContactContent() {
  return (
    <div className="flex flex-col items-center mt-4 max-w-4xl mx-auto">
      <GlassCard 
        elevation={3}
        interactive={false}
        floating={true}
        cursorGlow={true}
        noiseTexture={true}
        className="text-center p-8 mb-8"
      >
        <span className="text-5xl mb-4 block animate-wiggle">🚀</span>
        <Heading className="font-heading font-black mb-4 text-3xl gradient-text">
          Ready to Build Something Reliable?
        </Heading>
        <Paragraph className="mb-6 max-w-xl text-lg text-secondary">
          Looking for a QA engineer who delivers 99.9% uptime? Let's discuss how I can strengthen your team's quality assurance strategy and prevent critical bugs before they impact your users.
        </Paragraph>
        
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <a href="mailto:isaacavazquez95@gmail.com">
            <MorphButton
              variant="primary"
              size="md"
              icon={<FaEnvelope className="text-lg" />}
              iconPosition="left"
            >
              Schedule a Discussion
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
          Available for full-time opportunities and consulting engagements
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
  );
}