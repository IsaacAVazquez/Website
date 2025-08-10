"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { GlassCard } from "./GlassCard";
import { personalMetrics } from "@/constants/personal";
import { 
  IconCode, 
  IconBug, 
  IconTarget, 
  IconTrendingUp,
  IconCup,
  IconMoon,
  IconUsers,
  IconShield,
  IconRocket,
  IconHeart
} from "@tabler/icons-react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

const AnimatedCounter = ({ 
  value, 
  duration = 2, 
  delay = 0, 
  suffix = "", 
  prefix = "",
  decimals = 0 
}: AnimatedCounterProps) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    return prefix + latest.toFixed(decimals) + suffix;
  });
  const springCount = useSpring(count, { duration: duration * 1000, bounce: 0 });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      springCount.set(value);
    }, delay * 1000);
    
    return () => clearTimeout(timer);
  }, [value, delay, springCount]);

  return <motion.span>{rounded}</motion.span>;
};

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  color: string;
  description: string;
  delay?: number;
}

const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  suffix = "", 
  prefix = "",
  decimals = 0,
  color, 
  description, 
  delay = 0 
}: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <GlassCard
        elevation={3}
        interactive={true}
        cursorGlow={true}
        noiseTexture={true}
        className="p-6 relative overflow-hidden group"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-20`}>
              <Icon className="h-6 w-6 text-electric-blue" />
            </div>
            <h3 className="font-semibold text-lg text-primary">{label}</h3>
          </div>
          
          <div className="text-3xl font-bold text-electric-blue mb-2 font-terminal">
            <AnimatedCounter 
              value={value} 
              suffix={suffix} 
              prefix={prefix}
              decimals={decimals}
              delay={delay + 0.5}
            />
          </div>
          
          <p className="text-sm text-secondary leading-relaxed">{description}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
};

interface AchievementBadgeProps {
  achievement: typeof personalMetrics.achievements[0];
  delay?: number;
}

const AchievementBadge = ({ achievement, delay = 0 }: AchievementBadgeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlassCard
        elevation={2}
        interactive={true}
        cursorGlow={true}
        className="p-4 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10 text-center">
          <div className="text-3xl mb-2">{achievement.icon}</div>
          <h4 className="font-semibold text-primary text-sm mb-1">{achievement.title}</h4>
          <p className="text-xs text-secondary mb-2">{achievement.year}</p>
          
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: isHovered ? 1 : 0, 
              height: isHovered ? "auto" : 0 
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-secondary mb-1">{achievement.description}</p>
            <p className="text-xs text-matrix-green">{achievement.impact}</p>
          </motion.div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

const SystemStatus = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const statusIndicators = [
    { 
      label: "System Status", 
      value: personalMetrics.currentStatus.availability,
      color: "bg-matrix-green",
      pulse: true
    },
    { 
      label: "Learning", 
      value: personalMetrics.currentStatus.learning,
      color: "bg-electric-blue",
      pulse: false
    },
    { 
      label: "Building", 
      value: personalMetrics.currentStatus.building,
      color: "bg-warning-amber",
      pulse: false
    },
    { 
      label: "Mood", 
      value: personalMetrics.currentStatus.mood,
      color: "bg-neon-purple",
      pulse: false
    }
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <GlassCard
        elevation={4}
        interactive={true}
        cursorGlow={true}
        noiseTexture={true}
        className="p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 breathing-gradient" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary text-lg">System Status</h3>
            <div className="text-sm text-secondary font-terminal">
              {currentTime.toLocaleTimeString()} CST
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statusIndicators.map((indicator, index) => (
              <div key={indicator.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${indicator.color} ${indicator.pulse ? 'animate-pulse' : ''}`} />
                <div>
                  <div className="text-sm font-medium text-primary">{indicator.label}</div>
                  <div className="text-xs text-secondary">{indicator.value}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200/20">
            <div className="text-sm text-secondary">
              <span className="text-matrix-green">$</span> uptime: {personalMetrics.experience.yearsInQA} years, {Math.floor(personalMetrics.experience.yearsInQA * 365)} days
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export function PersonalMetrics() {
  const metrics = [
    {
      icon: IconCode,
      label: "Tests Written",
      value: personalMetrics.experience.testsWritten,
      suffix: "",
      color: "from-blue-400 to-blue-600",
      description: "Comprehensive test suites ensuring quality and reliability",
      delay: 0
    },
    {
      icon: IconBug,
      label: "Bugs Squashed",
      value: personalMetrics.experience.bugsSquashed,
      suffix: "",
      color: "from-red-400 to-red-600", 
      description: "Critical issues identified and resolved before production",
      delay: 0.1
    },
    {
      icon: IconTarget,
      label: "Uptime Achieved",
      value: personalMetrics.experience.uptimeAchieved,
      suffix: "%",
      decimals: 1,
      color: "from-green-400 to-green-600",
      description: "System reliability maintained through rigorous testing",
      delay: 0.2
    },
    {
      icon: IconRocket,
      label: "Releases Shipped",
      value: personalMetrics.experience.releasesShipped,
      suffix: "",
      color: "from-purple-400 to-purple-600",
      description: "Successful deployments with zero critical defects",
      delay: 0.3
    },
    {
      icon: IconUsers,
      label: "Voters Reached",
      value: personalMetrics.experience.votersReached / 1000000,
      suffix: "M",
      decimals: 1,
      color: "from-teal-400 to-teal-600",
      description: "Democratic participation enabled through quality platforms",
      delay: 0.4
    },
    {
      icon: IconCup,
      label: "Coffee Consumed",
      value: personalMetrics.experience.coffeeConsumed,
      suffix: " cups",
      color: "from-amber-400 to-amber-600",
      description: "Fuel for late-night debugging sessions and quality assurance",
      delay: 0.5
    },
    {
      icon: IconMoon,
      label: "Late Night Deploys",
      value: personalMetrics.experience.lateNightDeployments,
      suffix: "",
      color: "from-indigo-400 to-indigo-600",
      description: "Critical fixes deployed during off-hours for maximum uptime",
      delay: 0.6
    },
    {
      icon: IconHeart,
      label: "Teams Mentored",
      value: personalMetrics.experience.teamsMentored,
      suffix: "",
      color: "from-pink-400 to-pink-600",
      description: "Cross-functional teams guided in quality best practices",
      delay: 0.7
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
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Personal Metrics</h2>
        <p className="text-secondary">Real-time insights into my QA engineering journey</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* System Status */}
      <SystemStatus />

      {/* Achievements */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-center gradient-text">Recent Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {personalMetrics.achievements.map((achievement, index) => (
            <AchievementBadge 
              key={achievement.title} 
              achievement={achievement}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}