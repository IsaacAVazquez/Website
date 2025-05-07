
import React, { useState } from 'react';
import { ExternalLink, BarChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
}

const projectsData: Project[] = [
  {
    id: 1,
    title: "2024 Fantasy Football RB Analysis",
    description: "Interactive visualization of top-scoring running backs in 0.5 PPR scoring format for the 2024 season, helping fantasy managers make data-driven decisions.",
    imageUrl: "https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    tags: ["Fantasy Football", "Data Analysis", "Sports Analytics"],
  }
];

const chartData = {
  labels: ['Christian McCaffrey', 'Raheem Mostert', 'Rachaad White', 'Breece Hall', 'Jahmyr Gibbs'],
  datasets: [
    {
      label: 'Fantasy Points (0.5 PPR)',
      data: [395.5, 285.7, 273.2, 262.8, 251.9],
      backgroundColor: 'rgba(56, 178, 172, 0.6)',
      borderColor: 'rgba(56, 178, 172, 1)',
      borderWidth: 1,
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Top 5 RBs - 2024 Fantasy Points (0.5 PPR)',
    },
  },
};

const Projects: React.FC = () => {
  const [showChart, setShowChart] = useState(false);

  const handleShowChart = () => {
    const chartWindow = window.open('', 'Fantasy Football Stats', 'width=800,height=600');
    if (chartWindow) {
      chartWindow.document.write(`
        <html>
          <head>
            <title>Fantasy Football Stats</title>
          </head>
          <body>
            <div id="chart" style="width: 800px; height: 600px;"></div>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script>
              const ctx = document.getElementById('chart');
              new Chart(ctx, {
                type: 'bar',
                data: ${JSON.stringify(chartData)},
                options: ${JSON.stringify(chartOptions)}
              });
            </script>
          </body>
        </html>
      `);
    }
  };

  return (
    <section id="projects" className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Projects
          </h2>
          <div className="w-16 h-1 bg-teal-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Data-driven fantasy football analysis
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          {projectsData.map((project) => (
            <div key={project.id} 
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2">
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
                
                <button 
                  onClick={handleShowChart}
                  className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <BarChart size={18} className="mr-2" />
                  View Stats
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
