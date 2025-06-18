import React from "react";
import { ArrowDownCircle } from "lucide-react";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";

const Hero: React.FC = () => {
  const scrollToNextSection = () => {
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const words = [
    { text: "Exploring" },
    { text: "data," },
    { text: "uncovering" },
    { text: "patterns," },
    { text: "and" },
    { text: "visualizing", className: "text-teal-600 dark:text-teal-400" },
    { text: "findings.", className: "text-teal-600 dark:text-teal-400" },
  ];

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="grid grid-cols-5 grid-rows-5 gap-4 h-full w-full opacity-5 dark:opacity-10">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="bg-teal-600 rounded-full transform translate-x-1/2 translate-y-1/2 scale-150"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${4 + (i % 4)}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10 flex flex-col items-center justify-center text-center">
        <TypewriterEffectSmooth words={words} />

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <a
            href="#projects"
            className="btn-primary"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="btn-secondary"
          >
            Get in Touch
          </a>
        </div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <button
            onClick={scrollToNextSection}
            className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            aria-label="Scroll to next section"
          >
            <ArrowDownCircle size={36} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;