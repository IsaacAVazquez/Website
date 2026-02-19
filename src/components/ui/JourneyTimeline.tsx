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
        <div className="relative z-10 w-16 h-16 rounded-full bg-[var(--surface-elevated)] p-2 mb-4 border-2 border-[var(--border-primary)]">
          {item.logo ? (
            <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-[var(--surface-elevated)]">
              <Image
                src={item.logo}
                alt={`${item.company} logo`}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Vertical line */}
        {!isLast && (
          <div className="w-0.5 h-32 bg-gradient-to-b from-[var(--color-primary)]/50 to-transparent" />
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
                  <h3 className="text-xl font-bold text-[var(--color-primary)]">
                    {item.role}
                  </h3>
                  <div className="text-sm text-[var(--text-tertiary)] font-mono">
                    {item.year}
                  </div>
                </div>
                <div className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  {item.company}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-[var(--text-secondary)] mb-4 leading-relaxed">
              {item.description}
            </p>

            {/* Tech Stack */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <IconCode className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="text-sm font-semibold text-[var(--color-primary)]">
                  Tech Stack
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 text-xs rounded-full bg-[var(--surface-secondary)] border border-[var(--color-primary)]/30 text-[var(--color-primary)] font-mono"
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
            <Heading level={2} className="text-[var(--color-primary)] text-2xl lg:text-3xl mb-6">
              Career Journey
            </Heading>
            <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-3xl mx-auto">
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
