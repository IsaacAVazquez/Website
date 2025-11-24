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
    // Problem-Process-Result Framework
    problem?: {
      context: string;
      painPoints: string[];
      stakes: string;
    };
    process?: {
      approach: string;
      methodology: string[];
      decisions: string[];
      collaboration?: string;
    };
    result?: {
      outcomes: string[];
      testimonial?: {
        quote: string;
        author: string;
        role: string;
      };
      lessonsLearned?: string[];
    };
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

                {/* Problem-Process-Result Framework */}
                {project.problem && (
                  <div className="space-y-6">
                    <div className="border-t-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 pt-6">
                      <h3 className="text-xl font-bold text-[#FF6B35] dark:text-[#FF8E53] mb-6">📋 Full Case Study</h3>

                      {/* Problem Section */}
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-[#4A3426] dark:text-[#FFE4D6] mb-3 flex items-center gap-2">
                          <span className="text-2xl">🎯</span>
                          The Problem
                        </h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-[#FFF8F0] dark:bg-[#4A3426]/30 rounded-lg border-l-4 border-[#FF6B35]">
                            <p className="text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">{project.problem.context}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#6B4F3D] dark:text-[#D4A88E] mb-2">Key Pain Points:</p>
                            <ul className="space-y-2">
                              {project.problem.painPoints.map((point, index) => (
                                <li key={index} className="flex items-start gap-3">
                                  <div className="w-2 h-2 rounded-full bg-[#FF6B35] mt-2 flex-shrink-0" />
                                  <span className="text-[#4A3426] dark:text-[#D4A88E]">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-4 bg-[#FFB020]/10 dark:bg-[#FFB020]/20 rounded-lg border-l-4 border-[#FFB020]">
                            <p className="text-sm font-semibold text-[#6B4F3D] dark:text-[#D4A88E] mb-1">Stakes:</p>
                            <p className="text-[#4A3426] dark:text-[#D4A88E] italic">{project.problem.stakes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Process Section */}
                      {project.process && (
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-[#4A3426] dark:text-[#FFE4D6] mb-3 flex items-center gap-2">
                            <span className="text-2xl">⚙️</span>
                            The Process
                          </h4>
                          <div className="space-y-4">
                            <div className="p-4 bg-[#FFF8F0] dark:bg-[#4A3426]/30 rounded-lg border-l-4 border-[#F7B32B]">
                              <p className="text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">{project.process.approach}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#6B4F3D] dark:text-[#D4A88E] mb-2">Methodology:</p>
                              <ul className="space-y-2">
                                {project.process.methodology.map((method, index) => (
                                  <li key={index} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#F7B32B] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                      {index + 1}
                                    </div>
                                    <span className="text-[#4A3426] dark:text-[#D4A88E]">{method}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#6B4F3D] dark:text-[#D4A88E] mb-2">Key Decisions:</p>
                              <ul className="space-y-2">
                                {project.process.decisions.map((decision, index) => (
                                  <li key={index} className="flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-[#FF8E53] mt-2 flex-shrink-0" />
                                    <span className="text-[#4A3426] dark:text-[#D4A88E]">{decision}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {project.process.collaboration && (
                              <div className="p-4 bg-[#6BCF7F]/10 dark:bg-[#6BCF7F]/20 rounded-lg border-l-4 border-[#6BCF7F]">
                                <p className="text-sm font-semibold text-[#6B4F3D] dark:text-[#D4A88E] mb-1">Collaboration:</p>
                                <p className="text-[#4A3426] dark:text-[#D4A88E]">{project.process.collaboration}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Result Section */}
                      {project.result && (
                        <div>
                          <h4 className="text-lg font-semibold text-[#4A3426] dark:text-[#FFE4D6] mb-3 flex items-center gap-2">
                            <span className="text-2xl">🎉</span>
                            The Results
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold text-[#6B4F3D] dark:text-[#D4A88E] mb-2">Outcomes Achieved:</p>
                              <ul className="space-y-2">
                                {project.result.outcomes.map((outcome, index) => (
                                  <li key={index} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#6BCF7F] text-white flex items-center justify-center text-lg flex-shrink-0">
                                      ✓
                                    </div>
                                    <span className="text-[#4A3426] dark:text-[#D4A88E] font-medium">{outcome}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {project.result.testimonial && (
                              <div className="p-6 bg-gradient-to-br from-[#FF6B35]/5 to-[#F7B32B]/5 dark:from-[#FF8E53]/10 dark:to-[#FFC857]/10 rounded-lg border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30">
                                <p className="text-lg text-[#4A3426] dark:text-[#D4A88E] italic mb-4">"{project.result.testimonial.quote}"</p>
                                <div className="flex items-center gap-3">
                                  <div className="w-1 h-12 bg-gradient-to-b from-[#FF6B35] to-[#F7B32B]" />
                                  <div>
                                    <p className="font-semibold text-[#4A3426] dark:text-[#FFE4D6]">{project.result.testimonial.author}</p>
                                    <p className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">{project.result.testimonial.role}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {project.result.lessonsLearned && (
                              <div>
                                <p className="text-sm font-semibold text-[#6B4F3D] dark:text-[#D4A88E] mb-2">Lessons Learned:</p>
                                <ul className="space-y-2">
                                  {project.result.lessonsLearned.map((lesson, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                      <div className="w-2 h-2 rounded-full bg-[#FFB020] mt-2 flex-shrink-0" />
                                      <span className="text-[#4A3426] dark:text-[#D4A88E]">{lesson}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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