"use client";

import { motion } from "framer-motion";
import { WarmCard } from "@/components/ui/WarmCard";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { Badge } from "@/components/ui/Badge";
import { ModernButton } from "@/components/ui/ModernButton";
import { 
  IconGraduationCap, 
  IconRocket, 
  IconUsers, 
  IconTrendingUp,
  IconLightbulb,
  IconTarget,
  IconChartBar,
  IconCode
} from "@tabler/icons-react";

export function ProductManagerJourney() {
  const journeySteps = [
    {
      phase: "Technical Foundation",
      period: "2018 - 2024",
      icon: IconCode,
      status: "completed",
      description: "Built deep technical credibility working with engineering teams, understanding system constraints, and developing products for 60M+ users.",
      achievements: [
        "Led product development for civic tech platforms",
        "Collaborated with cross-functional teams on product decisions",
        "Developed user empathy through direct feedback cycles",
        "Mastered technical product constraints and possibilities"
      ],
      skills: ["Technical Product Management", "Cross-functional Collaboration", "User Research", "Data Analysis"]
    },
    {
      phase: "Business Strategy Education",
      period: "2024 - Present",
      icon: IconGraduationCap,
      status: "current",
      description: "Developing world-class product management and strategic thinking skills at UC Berkeley Haas School of Business.",
      achievements: [
        "Learning advanced product strategy frameworks",
        "Studying innovation management and market analysis",
        "Building network with product leaders and founders",
        "Applying MBA concepts to real product challenges"
      ],
      skills: ["Product Strategy", "Market Analysis", "Business Model Design", "Strategic Planning"]
    },
    {
      phase: "Product Leadership",
      period: "2025 - Future",
      icon: IconRocket,
      status: "target",
      description: "Pursuing product management roles where I can leverage my unique technical foundation and business education to build impactful products.",
      achievements: [
        "Leading product teams from strategy to execution",
        "Driving user-centered product development",
        "Building products that scale and create business value",
        "Mentoring other technical professionals transitioning to PM"
      ],
      skills: ["Product Leadership", "Team Management", "Go-to-Market Strategy", "P&L Ownership"]
    }
  ];

  const uniqueValue = [
    {
      icon: IconCode,
      title: "Technical Credibility",
      description: "I speak engineering languages and understand technical constraints, enabling better product decisions and smoother collaboration with dev teams."
    },
    {
      icon: IconUsers,
      title: "Cross-functional Bridge",
      description: "My background allows me to effectively translate between technical teams, business stakeholders, and user needs."
    },
    {
      icon: IconGraduationCap,
      title: "Strategic Education",
      description: "UC Berkeley MBA education provides frameworks for product strategy, market analysis, and business model innovation."
    },
    {
      icon: IconTarget,
      title: "User-Centered Mindset",
      description: "Experience with technical systems has taught me the importance of user research and data-driven decisions."
    }
  ];

  return (
    <div className="space-y-12">
      {/* Journey Overview */}
      <div className="text-center">
        <Heading level={2} className="mb-4">
          My Product Management Journey
        </Heading>
        <Paragraph className="text-slate-400 max-w-3xl mx-auto">
          Transitioning from technical execution to product strategy through deliberate skill development, 
          education, and hands-on experience building products that users love.
        </Paragraph>
      </div>

      {/* Journey Timeline */}
      <div className="space-y-8">
        {journeySteps.map((step, index) => (
          <motion.div
            key={step.phase}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
          >
            <WarmCard hover={false} padding="md" className={`p-8 ${
              step.status === 'current' 
                ? 'border-electric-blue/50 bg-electric-blue/5' 
                : step.status === 'target'
                ? 'border-matrix-green/50 bg-matrix-green/5'
                : 'border-cyber-teal/30'
            }`}>
              <div className="flex items-start space-x-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  step.status === 'current' 
                    ? 'bg-electric-blue/20 text-electric-blue' 
                    : step.status === 'target'
                    ? 'bg-matrix-green/20 text-matrix-green'
                    : 'bg-cyber-teal/20 text-cyber-teal'
                }`}>
                  <step.icon className="w-8 h-8" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-white">{step.phase}</h3>
                    <Badge 
                      variant={
                        step.status === 'current' ? 'electric' : 
                        step.status === 'target' ? 'matrix' : 'outline'
                      }
                      size="sm"
                    >
                      {step.period}
                    </Badge>
                    {step.status === 'current' && (
                      <Badge variant="electric" size="sm">Current</Badge>
                    )}
                  </div>
                  
                  <Paragraph className="text-slate-300 mb-4">
                    {step.description}
                  </Paragraph>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-white mb-2">Key Achievements</h4>
                      <ul className="space-y-1">
                        {step.achievements.map((achievement, i) => (
                          <li key={i} className="text-sm text-slate-400 flex items-start space-x-2">
                            <span className="text-matrix-green mt-1">•</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-white mb-2">Core Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {step.skills.map((skill, i) => (
                          <Badge key={i} variant="outline" size="sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </WarmCard>
          </motion.div>
        ))}
      </div>

      {/* Unique Value Proposition */}
      <div className="mt-16">
        <div className="text-center mb-8">
          <Heading level={3} className="mb-4">
            Why Technical Background + MBA = Better Product Manager
          </Heading>
          <Paragraph className="text-slate-400 max-w-2xl mx-auto">
            My unique combination of technical depth and business strategy education creates 
            a competitive advantage in product management roles.
          </Paragraph>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {uniqueValue.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <WarmCard hover={false} padding="md" className="p-6 h-full hover:scale-105 transition-transform">
                <div className="flex items-start space-x-4">
                  <value.icon className="w-8 h-8 text-electric-blue mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-2">{value.title}</h4>
                    <p className="text-sm text-slate-300">{value.description}</p>
                  </div>
                </div>
              </WarmCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <WarmCard hover={false} padding="md" className="p-8 text-center bg-matrix-green/5 border-matrix-green/20">
        <IconLightbulb className="w-12 h-12 text-matrix-green mx-auto mb-4" />
        <Heading level={3} className="mb-4">
          Ready to Build Products Together?
        </Heading>
        <Paragraph className="text-slate-300 mb-6 max-w-2xl mx-auto">
          I'm actively seeking product management opportunities where I can leverage my technical 
          foundation and business education to create products that users love and drive business growth.
        </Paragraph>
        <div className="flex justify-center space-x-4">
          <ModernButton href="/contact" variant="primary">
            Let's Connect
          </ModernButton>
          <ModernButton href="/resume" variant="outline">
            View My Background
          </ModernButton>
        </div>
      </WarmCard>
    </div>
  );
}