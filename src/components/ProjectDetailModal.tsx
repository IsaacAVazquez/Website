"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconExternalLink, IconBrandGithub, IconClock, IconTargetArrow } from '@tabler/icons-react';
import { WarmCard } from '@/components/ui/WarmCard';
import { ModernButton } from '@/components/ui/ModernButton';
import { Badge } from '@/components/ui/Badge';
import { ProjectImage } from '@/components/ui/OptimizedImage';

interface ProjectDetailModalProps {
  project: {
    id: number;
    title: string;
    description: string;
    tech: string[];
    color: string;
    icon: React.ComponentType<{ className?: string }>;
    github?: string | null;
    link?: string | null;
    detailedMetrics?: {
      label: string;
      value: string;
      improvement?: string;
    }[];
    screenshot?: string;
    challenges?: string[];
    impact?: string;
    timeline?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailModal({ project, isOpen, onClose }: ProjectDetailModalProps) {
  if (!project) return null;

  const IconComponent = project.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <WarmCard
              hover={false}
              padding="none"
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/95 dark:bg-[#2D1B12]/95 backdrop-blur-sm border-b-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${project.color}`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#4A3426] dark:text-[#FFE4D6]">{project.title}</h2>
                    {project.timeline && (
                      <div className="flex items-center gap-2 text-[#6B4F3D] dark:text-[#D4A88E]">
                        <IconClock className="w-4 h-4" />
                        <span className="text-sm">{project.timeline}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#FFF8F0] dark:hover:bg-[#4A3426]/50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <IconX className="w-6 h-6 text-[#6B4F3D] dark:text-[#D4A88E]" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Screenshot */}
                {project.screenshot && (
                  <div className="relative rounded-lg overflow-hidden border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30">
                    <ProjectImage
                      src={project.screenshot}
                      alt={`${project.title} screenshot`}
                      width={800}
                      height={533}
                      className="w-full h-auto"
                      priority={false}
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <p className="text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">{project.description}</p>
                </div>

                {/* Tech Stack */}
                <div>
                  <h3 className="text-lg font-semibold text-[#FF6B35] dark:text-[#FF8E53] mb-3">Technology Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Metrics */}
                {project.detailedMetrics && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#FF6B35] dark:text-[#FF8E53] mb-4">Key Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.detailedMetrics.map((metric, index) => (
                        <div key={index} className="p-4 bg-[#FFF8F0] dark:bg-[#4A3426]/50 rounded-lg border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30">
                          <div className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mb-1">{metric.label}</div>
                          <div className="text-2xl font-bold text-[#FF6B35] dark:text-[#FF8E53] mb-1">{metric.value}</div>
                          {metric.improvement && (
                            <div className="text-sm text-[#6BCF7F] dark:text-[#8FE39E]">{metric.improvement}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenges */}
                {project.challenges && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#FF6B35] dark:text-[#FF8E53] mb-4">Technical Challenges</h3>
                    <ul className="space-y-2">
                      {project.challenges.map((challenge, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#FFB020] dark:bg-[#FFC857] mt-2 flex-shrink-0" />
                          <span className="text-[#4A3426] dark:text-[#D4A88E]">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Impact */}
                {project.impact && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#FF6B35] dark:text-[#FF8E53] mb-3 flex items-center gap-2">
                      <IconTargetArrow className="w-5 h-5 text-[#6BCF7F] dark:text-[#8FE39E]" />
                      Business Impact
                    </h3>
                    <div className="p-4 bg-[#6BCF7F]/10 dark:bg-[#6BCF7F]/20 border-2 border-[#6BCF7F]/20 dark:border-[#6BCF7F]/30 rounded-lg">
                      <p className="text-[#4A3426] dark:text-[#D4A88E]">{project.impact}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t-2 border-[#FFE4D6] dark:border-[#FF8E53]/30">
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer">
                      <ModernButton variant="primary" size="md">
                        <IconExternalLink className="w-4 h-4 inline mr-2" />
                        View Live Project
                      </ModernButton>
                    </a>
                  )}
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer">
                      <ModernButton variant="secondary" size="md">
                        <IconBrandGithub className="w-4 h-4 inline mr-2" />
                        View Code
                      </ModernButton>
                    </a>
                  )}
                </div>
              </div>
            </WarmCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}