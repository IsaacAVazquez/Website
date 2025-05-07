import React, { useRef, useEffect } from 'react';

interface DataEntry {
  label: string;
  value: number;
  color: string;
}

const sampleData: DataEntry[] = [
  { label: 'Research', value: 65, color: '#0D9488' },
  { label: 'Analysis', value: 85, color: '#0891B2' },
  { label: 'Visualization', value: 75, color: '#1D4ED8' },
  { label: 'Reporting', value: 60, color: '#4F46E5' },
  { label: 'Collaboration', value: 70, color: '#7C3AED' },
];

const DataVisualization: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas and set dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Drawing radar chart
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    const angleStep = (Math.PI * 2) / sampleData.length;
    
    // Draw axes
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < sampleData.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + radius * Math.cos(angle), 
        centerY + radius * Math.sin(angle)
      );
      ctx.stroke();
    }
    
    // Draw concentric circles
    for (let i = 1; i <= 5; i++) {
      const circleRadius = (radius / 5) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw data polygon
    ctx.beginPath();
    for (let i = 0; i < sampleData.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const dataRadius = (radius * sampleData[i].value) / 100;
      const x = centerX + dataRadius * Math.cos(angle);
      const y = centerY + dataRadius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    
    // Fill polygon with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(13, 148, 136, 0.2)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0.2)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw polygon outline
    ctx.strokeStyle = '#0D9488';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw data points
    for (let i = 0; i < sampleData.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const dataRadius = (radius * sampleData[i].value) / 100;
      const x = centerX + dataRadius * Math.cos(angle);
      const y = centerY + dataRadius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = sampleData[i].color;
      ctx.fill();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw labels
      const labelRadius = radius + 20;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);
      
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = 'currentColor';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sampleData[i].label, labelX, labelY);
      
      // Draw value text
      const valueRadius = (radius * sampleData[i].value) / 100 + 20;
      const valueX = centerX + valueRadius * Math.cos(angle);
      const valueY = centerY + valueRadius * Math.sin(angle);
      
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = sampleData[i].color;
      ctx.fillText(`${sampleData[i].value}%`, valueX, valueY);
    }
  }, []);
  
  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Data Visualization Example
          </h2>
          <div className="w-16 h-1 bg-teal-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            An interactive sample of how I visualize complex datasets
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg p-6">
          <canvas 
            ref={canvasRef} 
            className="w-full h-80 md:h-96"
          ></canvas>
          
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
            {sampleData.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-4 h-4 rounded-full mb-2" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}: {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataVisualization;