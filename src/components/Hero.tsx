import React from 'react';
import { ArrowDownCircle } from 'lucide-react';

const Hero: React.FC = () => {
  const scrollToNextSection = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="grid grid-cols-5 grid-rows-5 gap-4 h-full w-full opacity-5 dark:opacity-10">
          {Array.from({ length: 25 }).map((_, i) => (
            <div 
              key={i} 
              className="bg-teal-600 rounded-full transform translate-x-1/2 translate-y-1/2 scale-150"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${4 + (i % 4)}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-4xl mx-auto text-center p-4 sm:p-0">
          <span className="inline-block py-1 px-3 rounded-full text-xs sm:text-sm font-medium bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100 mb-4 sm:mb-6 transform hover:scale-105 transition-transform">
            Welcome to my personal site
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600">
            Sharing <span className="text-teal-600">insights</span> and <span className="text-teal-600">discoveries</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
            Exploring data, uncovering patterns, and visualizing findings in compelling ways.
            Join me on this journey of discovery and innovation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="#projects"
              className="inline-block px-8 py-3 bg-teal-600 text-white font-medium rounded-lg shadow-lg hover:bg-teal-700 transition-colors duration-300 transform hover:scale-105"
            >
              View Projects
            </a>
            <a
              href="#contact"
              className="inline-block px-8 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 transform hover:scale-105"
            >
              Get in Touch
            </a>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <button 
            onClick={scrollToNextSection}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
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