"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { WarmCard } from "./WarmCard";
import { personalMetrics } from "@/constants/personal";

interface SkillPoint {
  x: number;
  y: number;
  skill: typeof personalMetrics.skills.technical[0];
}

interface SkillsRadarProps {
  skills: typeof personalMetrics.skills.technical;
  size?: number;
  type: "technical" | "soft";
}

const SkillsRadar = ({ skills, size = 300, type }: SkillsRadarProps) => {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const center = size / 2;
  const maxRadius = size * 0.35;
  const levels = 5;
  const angleStep = (2 * Math.PI) / skills.length;

  // Calculate skill points
  const skillPoints: SkillPoint[] = skills.map((skill, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    const radius = (skill.level / 100) * maxRadius;
    
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      skill
    };
  });

  // Generate axis lines
  const axisLines = skills.map((skill, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const endX = center + maxRadius * Math.cos(angle);
    const endY = center + maxRadius * Math.sin(angle);
    
    return {
      x1: center,
      y1: center,
      x2: endX,
      y2: endY,
      skill: skill.name
    };
  });

  // Generate concentric circles
  const circles = Array.from({ length: levels }, (_, i) => {
    const radius = ((i + 1) / levels) * maxRadius;
    return {
      radius,
      level: ((i + 1) / levels) * 100
    };
  });

  // Generate label positions
  const labels = skills.map((skill, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const labelRadius = maxRadius + 30;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    
    return {
      x,
      y,
      skill,
      angle
    };
  });

  const pathData = skillPoints.map((point, index) => {
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ') + ' Z';

  const categoryColors = {
    technical: {
      automation: "#00F5FF",
      data: "#39FF14", 
      backend: "#BF00FF",
      security: "#FF073A",
      performance: "#FFB800",
      devops: "#00FFBF",
      mobile: "#FF6B6B",
      frontend: "#4ECDC4"
    },
    soft: {
      analytical: "#00F5FF",
      interpersonal: "#39FF14",
      leadership: "#BF00FF", 
      business: "#FFB800",
      optimization: "#00FFBF",
      teaching: "#FF6B6B"
    }
  };

  const getSkillColor = (skill: typeof personalMetrics.skills.technical[0]) => {
    return categoryColors[type][skill.category as keyof typeof categoryColors[typeof type]] || "#00F5FF";
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className="overflow-visible"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circles */}
        {circles.map((circle, index) => (
          <circle
            key={index}
            cx={center}
            cy={center}
            r={circle.radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
            strokeDasharray={index === circles.length - 1 ? "none" : "2,2"}
          />
        ))}
        
        {/* Axis lines */}
        {axisLines.map((line, index) => (
          <line
            key={index}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />
        ))}
        
        {/* Skill area */}
        <motion.path
          d={pathData}
          fill="rgba(0, 245, 255, 0.1)"
          stroke="#00F5FF"
          strokeWidth="2"
          initial={{ pathLength: 0, fillOpacity: 0 }}
          animate={{ 
            pathLength: animationComplete ? 1 : 0,
            fillOpacity: animationComplete ? 0.1 : 0
          }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        
        {/* Skill points */}
        {skillPoints.map((point, index) => {
          const isHovered = hoveredSkill === point.skill.name;
          
          return (
            <motion.g key={point.skill.name}>
              {/* Glow effect */}
              {isHovered && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill={getSkillColor(point.skill)}
                  opacity="0.3"
                  filter="blur(4px)"
                />
              )}
              
              {/* Main point */}
              <motion.circle
                cx={point.x}
                cy={point.y}
                r={isHovered ? 8 : 6}
                fill={getSkillColor(point.skill)}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.8, duration: 0.3 }}
                whileHover={{ scale: 1.2 }}
                onMouseEnter={() => setHoveredSkill(point.skill.name)}
                onMouseLeave={() => setHoveredSkill(null)}
              />
              
              {/* Skill level indicator */}
              <motion.text
                x={point.x}
                y={point.y - 15}
                textAnchor="middle"
                className="text-xs font-semibold fill-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {point.skill.level}%
              </motion.text>
            </motion.g>
          );
        })}
        
        {/* Labels */}
        {labels.map((label, index) => {
          const isHovered = hoveredSkill === label.skill.name;
          
          return (
            <motion.text
              key={label.skill.name}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`text-xs font-semibold transition-all duration-200 ${
                isHovered 
                  ? 'fill-electric-blue text-sm' 
                  : 'fill-slate-300'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 1.2, duration: 0.3 }}
              style={{
                fontSize: isHovered ? '14px' : '12px',
                filter: isHovered ? 'drop-shadow(0 0 4px rgba(0, 245, 255, 0.5))' : 'none'
              }}
            >
              {label.skill.name}
            </motion.text>
          );
        })}
        
        {/* Center dot */}
        <circle
          cx={center}
          cy={center}
          r="3"
          fill="#00F5FF"
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* Skill details */}
      {hoveredSkill && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 z-10"
        >
          <WarmCard hover={false} padding="md"
            elevation={3}
            cursorGlow={true}
            className="p-3 min-w-[200px] text-center"
          >
            <div className="text-sm font-semibold text-primary mb-1">
              {hoveredSkill}
            </div>
            <div className="text-xs text-secondary">
              {skills.find(s => s.name === hoveredSkill)?.level}% proficiency
            </div>
          </WarmCard>
        </motion.div>
      )}
    </div>
  );
};

export function SkillsRadarDashboard() {
  const [activeTab, setActiveTab] = useState<"technical" | "soft">("technical");
  
  const tabs = [
    { id: "technical", label: "Technical Skills", skills: personalMetrics.skills.technical },
    { id: "soft", label: "Soft Skills", skills: personalMetrics.skills.soft }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold gradient-text mb-2">Skills Radar</h2>
        <p className="text-secondary">Interactive visualization of my expertise areas</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="flex bg-terminal-bg/30 p-1 rounded-lg border border-electric-blue/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "technical" | "soft")}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-electric-blue text-terminal-bg shadow-lg'
                  : 'text-slate-400 hover:text-electric-blue'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center">
        <WarmCard hover={false} padding="md"
          elevation={4}
          interactive={true}
          cursorGlow={true}
          noiseTexture={true}
          className="p-8 relative overflow-visible"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-500/10 breathing-gradient" />
          
          <div className="relative z-10">
            <SkillsRadar
              skills={tabs.find(tab => tab.id === activeTab)?.skills || []}
              size={400}
              type={activeTab}
            />
          </div>
        </WarmCard>
      </div>

      {/* Skills Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tabs.find(tab => tab.id === activeTab)?.skills.map((skill, index) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <WarmCard hover={false} padding="md"
              elevation={2}
              interactive={true}
              className="p-4 text-center"
            >
              <div className="text-sm font-semibold text-primary mb-1">
                {skill.name}
              </div>
              <div className="text-xs text-secondary mb-2">
                {skill.level}%
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <motion.div
                  className="h-2 rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, #00F5FF 0%, #39FF14 100%)`,
                    width: `${skill.level}%`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.level}%` }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                />
              </div>
            </WarmCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}