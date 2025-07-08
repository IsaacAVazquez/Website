"use client";
import { Paragraph } from "@/components/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

export default function About() {
  return (
    <section
      className="relative z-10 flex flex-col items-center py-20 px-6 md:px-0 bg-gradient-to-br from-neutral-50 via-white to-neutral-200 dark:from-gray-950/90 dark:via-gray-900/80 dark:to-gray-950/90 min-h-screen rounded-3xl shadow-2xl"
    >
      <div className="max-w-3xl w-full text-center md:text-left">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-sky-400 to-purple-600 bg-clip-text text-transparent animate-fade-in">
          About Me
        </h2>

        <Paragraph className="text-lg md:text-xl mb-6 text-gray-700 dark:text-gray-300">
          Hi, I’m Isaac. I build reliable, impactful software at the intersection of tech and democracy.
        </Paragraph>

        <Paragraph className="mb-6 text-gray-600 dark:text-gray-400">
          My journey started in political organizing and grew into a passion for civic technology. As a QA Engineer and product builder, I obsess over every detail—because building trustworthy tools isn’t just about code, it’s about empowering real people.
        </Paragraph>

        <Paragraph className="mb-6 text-gray-600 dark:text-gray-400">
          Whether I’m leading cross-functional QA efforts at a political tech startup or collaborating on data-driven product launches, I focus on clarity, accessibility, and creative problem-solving. My career is defined by my commitment to making complex systems understandable and impactful for the communities they serve.
        </Paragraph>

        <Paragraph className="mb-6 text-gray-600 dark:text-gray-400">
          Outside of work, you’ll find me cooking up new recipes, hiking Texas trails, or volunteering to help organize local elections. I believe in technology’s power to build stronger, more representative communities—and I’m just getting started.
        </Paragraph>

        {/* Enhanced Glass Cards */}
        <motion.div 
          className="my-10 flex flex-col gap-6 md:gap-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard
              elevation={3}
              interactive={true}
              cursorGlow={true}
              noiseTexture={true}
              className="p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 to-blue-500/10 rounded-xl breathing-gradient" />
              <h3 className="text-xl font-bold mb-2 text-vivid-blue relative z-10">Education</h3>
              <p className="text-secondary relative z-10">
                B.A., Political Science & International Affairs<br />
                <span className="text-xs opacity-75">Florida State University, magna cum laude, Phi Beta Kappa</span>
              </p>
            </GlassCard>
            
            <GlassCard
              elevation={3}
              interactive={true}
              cursorGlow={true}
              noiseTexture={true}
              className="p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-xl breathing-gradient" />
              <h3 className="text-xl font-bold mb-2 text-vivid-purple relative z-10">Experience</h3>
              <p className="text-secondary relative z-10">
                6+ years in QA, analytics, and civic tech.<br />
                Led automation, data validation, and release quality at high-growth startups.
              </p>
            </GlassCard>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard
              elevation={3}
              interactive={true}
              cursorGlow={true}
              noiseTexture={true}
              className="p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-red-500/10 rounded-xl breathing-gradient" />
              <h3 className="text-xl font-bold mb-2 text-vivid-pink relative z-10">Skills</h3>
              <p className="text-secondary relative z-10">
                QA, Automation, T-SQL, MySQL, NoSQL, Data Analysis, Product Collaboration
              </p>
            </GlassCard>
            
            <GlassCard
              elevation={3}
              interactive={true}
              cursorGlow={true}
              noiseTexture={true}
              className="p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-green-500/10 rounded-xl breathing-gradient" />
              <h3 className="text-xl font-bold mb-2 text-vivid-teal relative z-10">Focus Areas</h3>
              <p className="text-secondary relative z-10">
                Product Quality, Civic Tech, Data-Driven Impact, Empowering Representation
              </p>
            </GlassCard>
          </div>
        </motion.div>
      </div>
      {/* Subtle animated background/tech lines can be added with a canvas or SVG */}
    </section>
  );
}