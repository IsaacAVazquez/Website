import React from 'react';
import { BookOpen, Code, Award, Star } from 'lucide-react';

const About: React.FC = () => {
  return (
    <section
      id="about"
      className="py-24 bg-gradient-to-b from-white to-primary-50 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About Me
          </h2>
          <div className="w-16 h-1 bg-primary-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            QA Engineer, data enthusiast, and passionate advocate for civic engagement through technology.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                With a robust background in quality assurance, data analysis, and political technology, I focus on ensuring software reliability and functionality to empower social impact initiatives. My professional journey has spanned roles in client services, digital media, and analytics, always driven by the goal of making complex information accessible and actionable.
              </p>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                I believe deeply in technology's potential to foster civic participation and drive meaningful change. Throughout my career, I've prioritized clear communication, meticulous testing, and collaborative problem-solving to deliver products that resonate and perform.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Outside of my professional life, I engage actively in political organizing, explore new technologies, and continuously seek opportunities to learn and contribute to the tech and civic communities.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-3">
                  <BookOpen className="text-primary-600" size={24} />
                  <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">Education</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">B.A. Political Science and International Affairs, FSU (magna cum laude, Phi Beta Kappa)</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-3">
                  <Code className="text-primary-600" size={24} />
                  <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">Skills</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">QA, T-SQL, MySQL, NoSQL, Data Analysis, Automation Testing</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-3">
                  <Award className="text-primary-600" size={24} />
                  <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">Experience</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">7+ years in QA, data analytics, and political technology</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-3">
                  <Star className="text-primary-600" size={24} />
                  <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">Focus Areas</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">Quality Assurance, Civic Tech, Data-Driven Decision Making</p>
              </div>
            </div>
          </div>
          
          <div className="order-1 md:order-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 bg-gradient-to-br from-primary-500 to-primary-700 p-1">
              <img 
                src="https://raw.githubusercontent.com/IsaacAVazquez/portfolio/main/profile.jpg" 
                alt="Isaac Vazquez"
                className="w-full h-auto rounded-xl"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "https://media.licdn.com/dms/image/v2/D4E03AQHo5D0kG33ICw/profile-displayphoto-shrink_800_800/B4EZZCDEq4HUAc-/0/1744864824273?e=1752105600&v=beta&t=mQBvnAtwNhJTJxmMHCKSbL2wf1NfVkcPbb2BLnl3Lqo";
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;