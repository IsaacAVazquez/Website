"use client";

import { WarmCard } from "./WarmCard";
import { Heading } from "./Heading";
import { personalMetrics } from "@/constants/personal";
import Image from "next/image";
import {
  IconBriefcase,
  IconSchool,
  IconTrendingUp,
  IconCode,
  IconRocket
} from "@tabler/icons-react";

interface TimelineItemProps {
  item: typeof personalMetrics.careerTimeline[0];
  isLast: boolean;
}

const TimelineItem = ({ item, isLast }: TimelineItemProps) => {
  const getIcon = () => {
    const company = item.company.toLowerCase();
    if (company.includes('florida state')) return IconSchool;
    if (company.includes('open progress')) return IconTrendingUp;
    if (company.includes('civitech')) return IconBriefcase;
    if (company.includes('berkeley') || company.includes('haas')) return IconRocket;
    return IconBriefcase;
  };

  const Icon = getIcon();

  return (
    <div className="relative flex items-start gap-6 group">
      {/* Timeline line */}
      <div className="relative flex flex-col items-center">
        {/* Year badge with logo */}
        <div className="relative z-10 w-16 h-16 rounded-full bg-white dark:bg-[#2D1B12] p-2 mb-4 shadow-warm-lg border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30">
          {item.logo ? (
            <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-white dark:bg-[#2D1B12]">
              <Image
                src={item.logo}
                alt={`${item.company} logo`}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FF6B35] to-[#F7B32B] flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Vertical line */}
        {!isLast && (
          <div className="w-0.5 h-32 bg-gradient-to-b from-[#FF6B35]/50 to-transparent" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <WarmCard hover={true} padding="lg">
          <div>
            {/* Header */}
            <div className="flex items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-[#FF6B35]">
                    {item.role}
                  </h3>
                  <div className="text-sm text-[#F7B32B] font-mono">
                    {item.year}
                  </div>
                </div>
                <div className="text-lg font-semibold text-[#2D1B12] dark:text-[#FFE4D6] mb-2">
                  {item.company}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-[#4A3426] dark:text-[#D4A88E] mb-4 leading-relaxed">
              {item.description}
            </p>

            {/* Tech Stack */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <IconCode className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-sm font-semibold text-[#FF6B35]">
                  Tech Stack
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 text-xs rounded-full bg-[#FFF8F0] border border-[#FF6B35]/30 text-[#FF6B35] font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </WarmCard>
      </div>
    </div>
  );
};

export function JourneyTimeline() {
  return (
    <div className="max-w-5xl mx-auto">
      <WarmCard hover={true} padding="xl">
        <div className="space-y-10">
          {/* Header */}
          <div className="text-center">
            <Heading level={2} className="text-[#FF6B35] text-2xl lg:text-3xl mb-6">
              Career Journey
            </Heading>
            <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed max-w-3xl mx-auto">
              From Political Science graduate to QA engineer, and now an MBA candidate at UC Berkeley, my career has been a journey of continuous learning and impact. Here's a snapshot of my professional timeline.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline items */}
            <div className="relative space-y-4">
              {personalMetrics.careerTimeline.map((item, index) => (
                <TimelineItem
                  key={`${item.year}-${item.role}`}
                  item={item}
                  isLast={index === personalMetrics.careerTimeline.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
