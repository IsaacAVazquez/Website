import React from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  dataUrl?: string;
}

const projectsData: Project[] = [
  {
    id: 1,
    title: "Global Temperature Trends",
    description: "An interactive visualization of global temperature changes over the past century, highlighting regional variations and patterns.",
    imageUrl: "https://images.pexels.com/photos/3760625/pexels-photo-3760625.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    tags: ["Climate Data", "Visualization", "Time Series"],
    dataUrl: "#project1",
  },
  {
    id: 2,
    title: "Consumer Spending Analysis",
    description: "Exploring shifts in consumer spending habits across demographics, with insights on emerging trends and future projections.",
    imageUrl: "https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    tags: ["Market Research", "Trend Analysis", "Demographics"],
    dataUrl: "#project2",
  },
  {
    id: 3,
    title: "Urban Mobility Patterns",
    description: "Analysis of transportation data revealing how people move within cities, with implications for urban planning and infrastructure.",
    imageUrl: "https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    tags: ["Transportation", "Urban Planning", "Geospatial"],
    dataUrl: "#project3",
  },
  {
    id: 4,
    title: "Language Evolution in Social Media",
    description: "Tracking the evolution of language and communication patterns on social platforms over the past decade.",
    imageUrl: "https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    tags: ["NLP", "Social Media", "Linguistics"],
    dataUrl: "#project4",
  },
];

const Projects: React.FC = () => {
  return (
    <section id="projects" className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Projects
          </h2>
          <div className="w-16 h-1 bg-teal-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Explore my latest data-driven projects and research findings
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {projectsData.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2">
      <div className="relative">
        <img 
          src={project.imageUrl} 
          alt={project.title} 
          className="w-full h-56 object-cover"
        />
      </div>
      
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag, index) => (
            <span 
              key={index}
              className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {project.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {project.description}
        </p>
        
        <div className="flex justify-between items-center">
          <a 
            href={project.dataUrl} 
            className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Explore Data <ArrowRight size={16} className="ml-1" />
          </a>
          
          <a 
            href={project.dataUrl} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={`View ${project.title} details`}
          >
            <ExternalLink size={18} className="text-gray-500 dark:text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Projects;