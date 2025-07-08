"use client";
import { Heading } from "@/components/Heading";
import { Paragraph } from "@/components/Paragraph";
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
        <span className="text-5xl mb-4 block animate-wiggle">✉️</span>
        <Heading className="font-heading font-black mb-4 text-3xl gradient-text">
          Let's Connect!
        </Heading>
        <Paragraph className="mb-6 max-w-xl text-lg text-secondary">
          Whether you want to talk product, brainstorm ideas, or just grab a virtual coffee—my inbox is always open. Drop me a note and I'll get back to you soon!
        </Paragraph>
        
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <MorphButton
            variant="primary"
            size="md"
            icon={<FaEnvelope className="text-lg" />}
            iconPosition="left"
            onClick={() => window.location.href = 'mailto:isaacavazquez95@gmail.com'}
          >
            Email Me
          </MorphButton>
          
          <MorphButton
            variant="secondary"
            size="md"
            icon={<FaLinkedin className="text-lg" />}
            iconPosition="left"
            onClick={() => window.open('https://www.linkedin.com/in/isaac-vazquez', '_blank')}
          >
            LinkedIn
          </MorphButton>
        </div>
        
        <Paragraph className="text-sm text-secondary">
          Or just say hi and tell me about your latest project!
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