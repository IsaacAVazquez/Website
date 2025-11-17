"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { WarmCard } from "./WarmCard";
import { 
  IconTestPipe, 
  IconBug, 
  IconShield, 
  IconTarget,
  IconTrendingUp,
  IconUsers,
  IconServer,
  IconActivity
} from "@tabler/icons-react";

interface MetricProps {
  label: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "stable";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const QAMetric = ({ label, value, change, trend, icon: Icon, color }: MetricProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const numericValue = typeof value === "string" ? parseInt(value.replace(/\D/g, "")) : value;
    const timer = setTimeout(() => {
      setAnimatedValue(numericValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [value]);

  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    stable: "text-yellow-500",
  };

  return (
    <WarmCard hover={false} padding="md"
      elevation={2}
      interactive={true}
      cursorGlow={true}
      className="p-6 relative overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 breathing-gradient`} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${color} bg-opacity-20`}>
              <Icon className="h-5 w-5 text-vivid-blue" />
            </div>
            <h3 className="font-semibold text-sm text-secondary">{label}</h3>
          </div>
          
          <motion.div
            className="text-2xl font-bold text-primary mb-1"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            {typeof value === "string" ? value : animatedValue.toLocaleString()}
          </motion.div>
          
          <div className={`flex items-center gap-1 text-xs ${trendColors[trend]}`}>
            <span>{trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}</span>
            <span>{change}</span>
          </div>
        </div>
      </div>
    </WarmCard>
  );
};

const TestCoverage = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setProgress(94), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <WarmCard hover={false} padding="md"
      elevation={3}
      interactive={true}
      cursorGlow={true}
      className="p-6 col-span-full"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-blue-500/10 breathing-gradient" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary">Test Coverage</h3>
          <span className="text-2xl font-bold text-vivid-blue">{progress}%</span>
        </div>
        
        <div className="relative h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-vivid-blue to-vivid-teal rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          />
          
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: [-100, 300] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-500">Unit</div>
            <div className="text-secondary">98%</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-500">Integration</div>
            <div className="text-secondary">92%</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-500">E2E</div>
            <div className="text-secondary">89%</div>
          </div>
        </div>
      </div>
    </WarmCard>
  );
};

export function QADashboard() {
  const metrics = [
    {
      label: "Tests Executed",
      value: "2,847",
      change: "+12% this week",
      trend: "up" as const,
      icon: IconTestPipe,
      color: "from-blue-400 to-blue-600",
    },
    {
      label: "Bugs Found",
      value: "23",
      change: "-15% vs last sprint",
      trend: "down" as const,
      icon: IconBug,
      color: "from-red-400 to-red-600",
    },
    {
      label: "Security Scans",
      value: "156",
      change: "+8% this month",
      trend: "up" as const,
      icon: IconShield,
      color: "from-green-400 to-green-600",
    },
    {
      label: "Success Rate",
      value: "97.3%",
      change: "+2.1% improvement",
      trend: "up" as const,
      icon: IconTarget,
      color: "from-purple-400 to-purple-600",
    },
    {
      label: "Performance",
      value: "1.2s",
      change: "avg load time",
      trend: "stable" as const,
      icon: IconActivity,
      color: "from-yellow-400 to-yellow-600",
    },
    {
      label: "Releases",
      value: "18",
      change: "+3 this month",
      trend: "up" as const,
      icon: IconTrendingUp,
      color: "from-teal-400 to-teal-600",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <IconServer className="h-6 w-6 text-vivid-blue" />
        <h2 className="text-2xl font-bold gradient-text">QA Dashboard</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-vivid-blue/50 to-transparent" />
        <motion.div
          className="px-3 py-1 glass-card text-xs font-semibold text-vivid-blue"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Live
        </motion.div>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        initial="hidden"
        animate="visible"
      >
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ delay: index * 0.1 }}
          >
            <QAMetric {...metric} />
          </motion.div>
        ))}
      </motion.div>

      <TestCoverage />

      {/* Recent Activity */}
      <WarmCard hover={false} padding="md"
        elevation={3}
        cursorGlow={true}
        noiseTexture={true}
        className="p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-cyan-500/10 breathing-gradient" />
        
        <div className="relative z-10">
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <IconUsers className="h-5 w-5" />
            Recent QA Activities
          </h3>
          
          <div className="space-y-3">
            {[
              { action: "Completed regression testing", time: "2 hours ago", status: "success" },
              { action: "Updated automation scripts", time: "4 hours ago", status: "info" },
              { action: "Found critical bug in payment flow", time: "6 hours ago", status: "warning" },
              { action: "Deployed to staging environment", time: "1 day ago", status: "success" },
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50/50 dark:bg-neutral-800/50"
              >
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === "success" ? "bg-green-500" :
                  activity.status === "warning" ? "bg-yellow-500" :
                  "bg-blue-500"
                }`} />
                <div className="flex-1">
                  <div className="font-medium text-sm text-primary">{activity.action}</div>
                  <div className="text-xs text-secondary">{activity.time}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </WarmCard>
    </motion.div>
  );
}