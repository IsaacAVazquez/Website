"use client";
import { Paragraph } from "@/components/Paragraph";

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

        {/* Animated dividers for a high-tech feel */}
        <div className="my-10 flex flex-col gap-6 md:gap-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 dark:bg-gray-900/70 backdrop-blur rounded-xl shadow-lg p-6 animate-fade-in-up border border-neutral-200 dark:border-gray-800">
              <h3 className="text-xl font-bold mb-2 text-sky-400">Education</h3>
              <p className="text-gray-700 dark:text-gray-300">
                B.A., Political Science & International Affairs<br />
                <span className="text-gray-500 text-sm">Florida State University, magna cum laude, Phi Beta Kappa</span>
              </p>
            </div>
            <div className="bg-white/60 dark:bg-gray-900/70 backdrop-blur rounded-xl shadow-lg p-6 animate-fade-in-up border border-neutral-200 dark:border-gray-800">
              <h3 className="text-xl font-bold mb-2 text-purple-400">Experience</h3>
              <p className="text-gray-700 dark:text-gray-300">
                6+ years in QA, analytics, and civic tech.<br />
                Led automation, data validation, and release quality at high-growth startups.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 dark:bg-gray-900/70 backdrop-blur rounded-xl shadow-lg p-6 animate-fade-in-up border border-neutral-200 dark:border-gray-800">
              <h3 className="text-xl font-bold mb-2 text-pink-400">Skills</h3>
              <p className="text-gray-700 dark:text-gray-300">
                QA, Automation, T-SQL, MySQL, NoSQL, Data Analysis, Product Collaboration
              </p>
            </div>
            <div className="bg-white/60 dark:bg-gray-900/70 backdrop-blur rounded-xl shadow-lg p-6 animate-fade-in-up border border-neutral-200 dark:border-gray-800">
              <h3 className="text-xl font-bold mb-2 text-teal-400">Focus Areas</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Product Quality, Civic Tech, Data-Driven Impact, Empowering Representation
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Subtle animated background/tech lines can be added with a canvas or SVG */}
    </section>
  );
}