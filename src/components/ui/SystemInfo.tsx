"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { WarmCard } from "./WarmCard";
import { personalMetrics } from "@/constants/personal";
import { 
  IconCpu, 
  IconDatabase, 
  IconNetwork, 
  IconDevices,
  IconTerminal,
  IconBolt,
  IconShield,
  IconBug,
  IconHeart,
  IconCoffee,
  IconMoon,
  IconSun
} from "@tabler/icons-react";

interface SystemSpecProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  specs: Record<string, string>;
  color: string;
  delay?: number;
}

const SystemSpecCard = ({ title, icon: Icon, specs, color, delay = 0 }: SystemSpecProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="group"
    >
      <WarmCard hover={false} padding="md"
        elevation={3}
        interactive={true}
        cursorGlow={true}
        noiseTexture={true}
        className="p-6 relative overflow-hidden cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-20`}>
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary">{title}</h3>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="ml-auto"
            >
              <IconTerminal className="w-5 h-5 text-primary" />
            </motion.div>
          </div>
          
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {Object.entries(specs).map(([key, value], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/30 border border-primary/20"
                >
                  <span className="text-sm font-medium text-secondary">
                    {key}:
                  </span>
                  <span className="text-sm text-primary font-mono">
                    {value}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {!isExpanded && (
            <div className="text-sm text-secondary">
              Click to expand system specifications
            </div>
          )}
        </div>
      </WarmCard>
    </motion.div>
  );
};

const PersonalityDebugger = () => {
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    >
      <WarmCard hover={false} padding="md"
        elevation={4}
        interactive={true}
        cursorGlow={true}
        noiseTexture={true}
        className="p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-500/10 breathing-gradient" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-500/20">
              <IconBug className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-primary">Personality Debugger</h3>
            <div className="ml-auto px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-mono">
              DEBUG MODE
            </div>
          </div>
          
          <div className="space-y-4">
            {personalMetrics.personalityTraits.map((trait, index) => (
              <motion.div
                key={trait.trait}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="cursor-pointer"
                onClick={() => setSelectedTrait(selectedTrait === trait.trait ? null : trait.trait)}
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/30 border border-primary/20 hover:border-primary/40 transition-colors">
                  <div className={`w-3 h-3 rounded-full ${
                    trait.severity === 'high' ? 'bg-error' :
                    trait.severity === 'warning' ? 'bg-warning' :
                    trait.severity === 'success' ? 'bg-success' :
                    'bg-primary'
                  } animate-pulse`} />
                  <span className="text-sm font-medium text-primary flex-1">
                    {trait.trait}
                  </span>
                  <span className="text-xs text-secondary">
                    {trait.severity.toUpperCase()}
                  </span>
                </div>
                
                {selectedTrait === trait.trait && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="mt-2 p-4 rounded-lg bg-neutral-900/50 border border-success/20"
                  >
                    <div className="text-sm text-secondary mb-2">
                      {trait.description}
                    </div>
                    <div className="text-xs font-mono text-success">
                      {trait.debugOutput}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </WarmCard>
    </motion.div>
  );
};

const PersonalAPIs = () => {
  const [selectedAPI, setSelectedAPI] = useState<string | null>(null);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      <WarmCard hover={false} padding="md"
        elevation={4}
        interactive={true}
        cursorGlow={true}
        noiseTexture={true}
        className="p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-cyan-500/10 breathing-gradient" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400/20 to-cyan-500/20">
              <IconNetwork className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-primary">Personal APIs</h3>
            <div className="ml-auto px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-mono">
              v1.0
            </div>
          </div>
          
          <div className="space-y-3">
            {Object.entries(personalMetrics.personalApis).map(([endpoint, config], index) => (
              <motion.div
                key={endpoint}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="cursor-pointer"
                onClick={() => setSelectedAPI(selectedAPI === endpoint ? null : endpoint)}
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/30 border border-accent/20 hover:border-accent/40 transition-colors">
                  <span className={`px-2 py-1 rounded text-xs font-mono ${
                    config.method === 'GET' ? 'bg-success/20 text-success' :
                    config.method === 'POST' ? 'bg-primary/20 text-primary' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {config.method}
                  </span>
                  <span className="text-sm font-mono text-accent flex-1">
                    {endpoint}
                  </span>
                </div>
                
                {selectedAPI === endpoint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="mt-2 p-4 rounded-lg bg-neutral-900/50 border border-accent/20"
                  >
                    <div className="text-sm text-secondary mb-2">
                      {config.description}
                    </div>
                    <div className="text-xs font-mono text-accent">
                      Response: {config.response}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </WarmCard>
    </motion.div>
  );
};

const LiveMetrics = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [coffeeLevel, setCoffeeLevel] = useState(75);
  const [energyLevel, setEnergyLevel] = useState(85);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Simulate fluctuating levels
      setCoffeeLevel(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 5)));
      setEnergyLevel(prev => Math.max(20, Math.min(100, prev + (Math.random() - 0.5) * 3)));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const isNightMode = currentTime.getHours() >= 22 || currentTime.getHours() <= 6;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.7 }}
    >
      <WarmCard hover={false} padding="md"
        elevation={4}
        interactive={true}
        cursorGlow={true}
        noiseTexture={true}
        className="p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-500/10 breathing-gradient" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20">
              <IconHeart className="w-6 h-6 text-warning" />
            </div>
            <h3 className="text-xl font-bold text-primary">Live Metrics</h3>
            <div className="ml-auto flex items-center gap-2">
              {isNightMode ? (
                <IconMoon className="w-4 h-4 text-primary" />
              ) : (
                <IconSun className="w-4 h-4 text-warning" />
              )}
              <span className="text-xs font-mono text-secondary">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <IconCoffee className="w-5 h-5 text-amber-500" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-primary">Coffee Level</span>
                    <span className="text-amber-500">{Math.round(coffeeLevel)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <motion.div
                      className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      animate={{ width: `${coffeeLevel}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <IconBolt className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-primary">Energy Level</span>
                    <span className="text-primary">{Math.round(energyLevel)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <motion.div
                      className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                      animate={{ width: `${energyLevel}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-sm text-secondary">
                  Status: {personalMetrics.currentStatus.availability}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm text-secondary">
                  Mode: {isNightMode ? 'Night Owl' : 'Day Warrior'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                <span className="text-sm text-secondary">
                  Uptime: {personalMetrics.experience.yearsInQA * 365} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </WarmCard>
    </motion.div>
  );
};

export function SystemInfo() {
  const systemSpecs = [
    {
      title: "CPU",
      icon: IconCpu,
      specs: personalMetrics.systemSpecs.cpu,
      color: "from-blue-400 to-blue-600"
    },
    {
      title: "Memory",
      icon: IconDatabase,
      specs: personalMetrics.systemSpecs.memory,
      color: "from-green-400 to-green-600"
    },
    {
      title: "Network",
      icon: IconNetwork,
      specs: personalMetrics.systemSpecs.network,
      color: "from-purple-400 to-purple-600"
    },
    {
      title: "Peripherals",
      icon: IconDevices,
      specs: personalMetrics.systemSpecs.peripherals,
      color: "from-teal-400 to-teal-600"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold gradient-text mb-2">System Information</h2>
        <p className="text-secondary">
          Human.exe specifications and debugging interface
        </p>
      </div>

      {/* System Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systemSpecs.map((spec, index) => (
          <SystemSpecCard
            key={spec.title}
            {...spec}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Live Metrics */}
      <LiveMetrics />

      {/* Personality Debugger */}
      <PersonalityDebugger />

      {/* Personal APIs */}
      <PersonalAPIs />
    </motion.div>
  );
}