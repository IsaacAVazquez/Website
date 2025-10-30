"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { GlassCard } from "./GlassCard";
import { personalMetrics } from "@/constants/personal";
import Image from "next/image";
import {
  IconBriefcase,
  IconSchool,
  IconTrendingUp,
  IconStar,
  IconCode,
  IconUsers,
  IconAward,
  IconRocket
} from "@tabler/icons-react";

interface TimelineItemProps {
  item: typeof personalMetrics.careerTimeline[0];
  index: number;
  isLast: boolean;
}

const TimelineItem = ({ item, index, isLast }: TimelineItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const getIcon = () => {
    const company = item.company.toLowerCase();
    if (company.includes('florida state')) return IconSchool;
    if (company.includes('open progress')) return IconTrendingUp;
    if (company.includes('civitech')) return IconBriefcase;
    if (company.includes('berkeley') || company.includes('haas')) return IconRocket;
    return IconBriefcase;
  };

  const Icon = getIcon();

  const getYearColor = () => {
    const company = item.company.toLowerCase();
    if (company.includes('florida state')) return "from-red-900 to-amber-700"; // FSU Garnet & Gold
    if (company.includes('open progress')) return "from-cyan-400 via-purple-400 to-teal-400"; // Open Progress gradient
    if (company.includes('civitech')) return "from-blue-500 to-blue-700"; // Civitech blue
    if (company.includes('berkeley') || company.includes('haas')) return "from-blue-900 to-yellow-600"; // UC Berkeley Blue & Gold
    return "from-electric-blue to-matrix-green";
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative flex items-start gap-6 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Timeline line */}
      <div className="relative flex flex-col items-center">
        {/* Year badge with logo */}
        <motion.div
          className={`relative z-10 w-16 h-16 rounded-full bg-white p-2 mb-4 shadow-lg border-2 ${
            isHovered ? 'border-electric-blue' : 'border-slate-300'
          }`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {item.logo ? (
            <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-white">
              <Image
                src={item.logo}
                alt={`${item.company} logo`}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          ) : (
            <div className={`w-full h-full rounded-full bg-gradient-to-br ${getYearColor()} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}

          {/* Glow effect */}
          {isHovered && (
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-br ${getYearColor()} opacity-30 blur-xl`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.3 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>

        {/* Vertical line */}
        {!isLast && (
          <motion.div
            className="w-0.5 h-32 bg-gradient-to-b from-electric-blue/50 to-transparent"
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
            style={{ originY: 0 }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
        >
          <GlassCard
            elevation={isHovered ? 4 : 3}
            interactive={true}
            cursorGlow={true}
            noiseTexture={true}
            className="p-6 relative overflow-hidden transition-all duration-300"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${getYearColor()} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-electric-blue">
                      {item.role}
                    </h3>
                    <div className="text-sm text-matrix-green font-terminal">
                      {item.year}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-primary mb-2">
                    {item.company}
                  </div>
                </div>
                
                {/* Achievement badge */}
                <motion.div
                  className="ml-4 p-2 rounded-lg bg-gradient-to-br from-warning-amber/20 to-warning-amber/40"
                  whileHover={{ scale: 1.05 }}
                >
                  <IconAward className="w-5 h-5 text-warning-amber" />
                </motion.div>
              </div>

              {/* Description */}
              <p className="text-secondary mb-4 leading-relaxed">
                {item.description}
              </p>

              {/* Achievement */}
              <div className="mb-4 p-3 rounded-lg bg-matrix-green/10 border border-matrix-green/20">
                <div className="flex items-center gap-2 mb-1">
                  <IconStar className="w-4 h-4 text-matrix-green" />
                  <span className="text-sm font-semibold text-matrix-green">
                    Key Achievement
                  </span>
                </div>
                <p className="text-sm text-secondary">
                  {item.achievement}
                </p>
              </div>

              {/* Tech Stack */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconCode className="w-4 h-4 text-electric-blue" />
                  <span className="text-sm font-semibold text-electric-blue">
                    Tech Stack
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.techStack.map((tech, techIndex) => (
                    <motion.span
                      key={tech}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.1 + techIndex * 0.05 + 0.5 }}
                      className="px-2 py-1 text-xs rounded-full bg-terminal-bg/50 border border-electric-blue/30 text-electric-blue font-terminal"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Milestone */}
              <div className="pt-3 border-t border-slate-200/20">
                <div className="flex items-center gap-2">
                  <IconUsers className="w-4 h-4 text-neon-purple" />
                  <span className="text-sm font-medium text-neon-purple">
                    Career Milestone:
                  </span>
                  <span className="text-sm text-secondary">
                    {item.milestone}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
};

const TimelineStats = () => {
  const totalYears = personalMetrics.careerTimeline.length;
  const companiesWorked = Array.from(new Set(personalMetrics.careerTimeline.map(item => item.company))).length;
  const rolesHeld = personalMetrics.careerTimeline.length;
  const skillsAcquired = personalMetrics.careerTimeline.reduce((acc, item) => acc + item.techStack.length, 0);

  const stats = [
    { label: "Years in Career", value: totalYears, icon: IconTrendingUp },
    { label: "Companies", value: companiesWorked, icon: IconBriefcase },
    { label: "Roles Held", value: rolesHeld, icon: IconUsers },
    { label: "Skills Acquired", value: skillsAcquired, icon: IconCode }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
        >
          <GlassCard
            elevation={2}
            interactive={true}
            cursorGlow={true}
            className="p-4 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-500/10 breathing-gradient" />
            
            <div className="relative z-10">
              <stat.icon className="w-8 h-8 text-electric-blue mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-secondary">
                {stat.label}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
};

export function JourneyTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold gradient-text mb-2">Career Journey</h2>
        <p className="text-secondary mb-8">
          From Political Science graduate to QA engineer, and now an MBA candidate at UC Berkeley, my career has been a journey of continuous learning and impact. Here’s a snapshot of my professional timeline.
        </p>
      </div>

      {/* Timeline Stats */}
      <TimelineStats />

      {/* Timeline */}
      <div className="relative">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        </div>

        {/* Timeline items */}
        <div className="relative space-y-4">
          {personalMetrics.careerTimeline.map((item, index) => (
            <TimelineItem
              key={`${item.year}-${item.role}`}
              item={item}
              index={index}
              isLast={index === personalMetrics.careerTimeline.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Philosophy Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-12"
      >
        <GlassCard
          elevation={4}
          interactive={true}
          cursorGlow={true}
          noiseTexture={true}
          className="p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-purple-500/10 breathing-gradient" />
          
          <div className="relative z-10 text-center">
            <h3 className="text-2xl font-bold gradient-text mb-4">
              My Journey Philosophy
            </h3>
            <p className="text-lg text-secondary leading-relaxed max-w-3xl mx-auto">
              {personalMetrics.philosophy.career}
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}