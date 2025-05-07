
import React, { useState } from 'react';
import { BarChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const rbData = [
  { name: "Saquon Barkley", points: 338.8, image: "https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/qb87h2nypebduowkii7c" },
  { name: "Jahmyr Gibbs", points: 336.9, image: "https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/aqcxqr4umc7zswfyayci" },
  { name: "Derrick Henry", points: 326.9, image: "https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/qe5qlxyyebvszgqob9zn" },
  { name: "Bijan Robinson", points: 311.2, image: "https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/sj9qlmqwvbbylpvxdhle" },
  { name: "Josh Jacobs", points: 275.1, image: "https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/lhkynhxpzuhvqzrjxvgr" }
];

const wrData = [
  { name: "Ja'Marr Chase", points: 339.5, image: "https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/i6co6v7qxfopbgmwu0qy" },
  { name: "Justin Jefferson", points: 266.0, image: "https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/mzdsotquu0qhmkxferdn" },
  { name: "Amon-Ra St. Brown", points: 258.7, image: "https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/kvncwl52ax9dpjlzxqwk" },
  { name: "Brian Thomas", points: 240.5, image: "https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/urcozrdlghryzxw2bwpc" },
  { name: "Drake London", points: 230.8, image: "https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/bqbqvmxhrgvqt5ywkrrq" }
];

const Projects = () => {
  const [activePosition, setActivePosition] = useState('RB');

  const getChartOptions = () => ({
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Fantasy Football Projections',
        font: { size: 16 }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: Math.min(...[...rbData, ...wrData].map(d => d.points)) - 10,
        title: {
          display: true,
          text: 'Fantasy Points'
        }
      }
    }
  });

  return (
    <section id="projects" className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Fantasy Football Analysis
          </h2>
          <div className="w-16 h-1 bg-teal-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Top performing players in 0.5 PPR scoring
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setActivePosition('RB')}
              className={`px-4 py-2 rounded-lg ${
                activePosition === 'RB'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Running Backs
            </button>
            <button
              onClick={() => setActivePosition('WR')}
              className={`px-4 py-2 rounded-lg ${
                activePosition === 'WR'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Wide Receivers
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg p-6">
              <Line 
                options={{
                  ...getChartOptions(),
                  plugins: {
                    ...getChartOptions().plugins,
                    title: {
                      display: true,
                      text: 'Top 5 RBs - 2024 Fantasy Points (0.5 PPR)',
                      font: { size: 16 }
                    }
                  }
                }}
                data={{
                  labels: rbData.map(p => p.name.split(' ')[0]),
                  datasets: [{
                    data: rbData.map(p => p.points),
                    borderColor: 'rgb(56, 178, 172)',
                    backgroundColor: 'rgba(56, 178, 172, 0.5)',
                    pointRadius: 8,
                    pointBackgroundColor: 'rgb(56, 178, 172)'
                  }]
                }}
              />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg p-6">
              <Line 
                options={{
                  ...getChartOptions(),
                  plugins: {
                    ...getChartOptions().plugins,
                    title: {
                      display: true,
                      text: 'Top 5 WRs - 2024 Fantasy Points (0.5 PPR)',
                      font: { size: 16 }
                    }
                  }
                }}
                data={{
                  labels: wrData.map(p => p.name.split(' ')[0]),
                  datasets: [{
                    data: wrData.map(p => p.points),
                    borderColor: 'rgb(139, 92, 246)',
                    backgroundColor: 'rgba(139, 92, 246, 0.5)',
                    pointRadius: 8,
                    pointBackgroundColor: 'rgb(139, 92, 246)'
                  }]
                }}
              />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            {(activePosition === 'RB' ? rbData : wrData).map((player, index) => (
              <div key={index} className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <img 
                  src={player.image} 
                  alt={player.name}
                  className="w-16 h-16 rounded-full mb-2 object-cover"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  {player.name}
                </span>
                <span className="text-sm font-bold text-teal-600">
                  {player.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
