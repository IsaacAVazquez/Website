import React from 'react';
import { Linkedin, Github } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-24 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Get In Touch
          </h2>
          <div className="w-16 h-1 bg-teal-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Have a question or interested in collaborating? Connect with me on social media.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Connect on Social Media
            </h3>
            <div className="flex justify-center space-x-4 mt-8">
              <a 
                href="https://www.linkedin.com/in/isaac-vazquez/" 
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 dark:bg-gray-600 rounded-full text-gray-800 dark:text-gray-200 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a 
                href="https://github.com/IsaacAVazquez" 
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 dark:bg-gray-600 rounded-full text-gray-800 dark:text-gray-200 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;