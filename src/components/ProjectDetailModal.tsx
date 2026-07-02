"use client";

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { IconX, IconExternalLink, IconBrandGithub, IconClock, IconTargetArrow } from '@tabler/icons-react';
import { WarmCard } from '@/components/ui/WarmCard';
import { ModernButton } from '@/components/ui/ModernButton';
import { Badge } from '@/components/ui/Badge';
import { ProjectImage } from '@/components/ui/OptimizedImage';
import { MetricCallout, MetricGrid } from '@/components/ui/MetricCallout';

export interface ProjectDetailModalProps {
  project: {
    id: number;
    title: string;
    description: string;
    tech: string[];
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
  const shouldReduceMotion = useReducedMotion();

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
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.9, y: shouldReduceMotion ? 0 : 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.9, y: shouldReduceMotion ? 0 : 50 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title} project details`}
          >
            <WarmCard
              hover={false}
              padding="none"
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/95 dark:bg-[var(--home-dark-panel)]/95 backdrop-blur-sm border-b-2 border-[var(--home-rule)] p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-[var(--home-signal)] to-[var(--home-signal)]">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--home-ink)]">{project.title}</h2>
                    {project.timeline && (
                      <div className="flex items-center gap-2 text-[var(--home-ink-muted)]">
                        <IconClock className="w-4 h-4" />
                        <span className="text-sm">{project.timeline}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[var(--home-paper-alt)] rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <IconX className="w-6 h-6 text-[var(--home-ink-muted)]" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Screenshot */}
                {project.screenshot && (
                  <div className="relative rounded-lg overflow-hidden border-2 border-[var(--home-rule)]">
                    <ProjectImage
                      src={project.screenshot}
                      alt={`${project.title} case study: ${project.description}`}
                      width={800}
                      height={533}
                      className="w-full h-auto"
                      priority={false}
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <p className="text-lg text-[var(--home-ink-muted)] leading-relaxed">{project.description}</p>
                </div>

                {/* Tech Stack */}
                <div>
                  <h3 className="text-lg font-semibold text-[var(--home-signal)] mb-3">Technology Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <Badge key={tech} variant="default">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Metrics - Enhanced with MetricCallout */}
                {project.detailedMetrics && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--home-signal)] mb-4">Key Metrics & Impact</h3>
                    <MetricGrid columns={2}>
                      {project.detailedMetrics.map((metric, index) => (
                        <MetricCallout
                          key={index}
                          value={metric.value}
                          label={metric.label}
                          improvement={metric.improvement}
                          variant={index === 0 ? 'primary' : 'default'}
                          size="md"
                          animateValue={true}
                        />
                      ))}
                    </MetricGrid>
                  </div>
                )}

                {/* Challenges */}
                {project.challenges && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--home-signal)] mb-4">Technical Challenges</h3>
                    <ul className="space-y-2">
                      {project.challenges.map((challenge, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[var(--home-warning)] mt-2 flex-shrink-0" />
                          <span className="text-[var(--home-ink-muted)]">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Impact */}
                {project.impact && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--home-signal)] mb-3 flex items-center gap-2">
                      <IconTargetArrow className="w-5 h-5 text-[var(--home-positive)]" />
                      Business Impact
                    </h3>
                    <div className="p-4 bg-[var(--home-positive)]/10 border-2 border-[var(--home-positive)]/20 rounded-lg">
                      <p className="text-[var(--home-ink-muted)]">{project.impact}</p>
                    </div>
                  </div>
                )}

                {/* Problem-Process-Result Framework */}
                {project.problem && (
                  <div className="space-y-6">
                    <div className="border-t-2 border-[var(--home-rule)] pt-6">
                      <h3 className="text-xl font-bold text-[var(--home-signal)] mb-6">Full Case Study</h3>

                      {/* Problem Section */}
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-[var(--home-ink)] mb-3 flex items-center gap-2">
                          <span className="text-2xl">🎯</span>
                          The Problem
                        </h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-[var(--home-paper-alt)] rounded-lg border-l-4 border-[var(--home-signal)]">
                            <p className="text-[var(--home-ink-muted)] leading-relaxed">{project.problem.context}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--home-ink-muted)] mb-2">Key Pain Points:</p>
                            <ul className="space-y-2">
                              {project.problem.painPoints.map((point, index) => (
                                <li key={index} className="flex items-start gap-3">
                                  <div className="w-2 h-2 rounded-full bg-[var(--home-signal)] mt-2 flex-shrink-0" />
                                  <span className="text-[var(--home-ink-muted)]">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-4 bg-[var(--home-warning)]/10 rounded-lg border-l-4 border-[var(--home-warning)]">
                            <p className="text-sm font-semibold text-[var(--home-ink-muted)] mb-1">Stakes:</p>
                            <p className="text-[var(--home-ink-muted)] italic">{project.problem.stakes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Process Section */}
                      {project.process && (
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-[var(--home-ink)] mb-3 flex items-center gap-2">
                            <span className="text-2xl">⚙️</span>
                            The Process
                          </h4>
                          <div className="space-y-4">
                            <div className="p-4 bg-[var(--home-paper-alt)] rounded-lg border-l-4 border-[var(--home-warning)]">
                              <p className="text-[var(--home-ink-muted)] leading-relaxed">{project.process.approach}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--home-ink-muted)] mb-2">Methodology:</p>
                              <ul className="space-y-2">
                                {project.process.methodology.map((method, index) => (
                                  <li key={index} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[var(--home-warning)] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                      {index + 1}
                                    </div>
                                    <span className="text-[var(--home-ink-muted)]">{method}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--home-ink-muted)] mb-2">Key Decisions:</p>
                              <ul className="space-y-2">
                                {project.process.decisions.map((decision, index) => (
                                  <li key={index} className="flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-[var(--home-signal)] mt-2 flex-shrink-0" />
                                    <span className="text-[var(--home-ink-muted)]">{decision}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {project.process.collaboration && (
                              <div className="p-4 bg-[var(--home-positive)]/10 rounded-lg border-l-4 border-[var(--home-positive)]">
                                <p className="text-sm font-semibold text-[var(--home-ink-muted)] mb-1">Collaboration:</p>
                                <p className="text-[var(--home-ink-muted)]">{project.process.collaboration}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Result Section */}
                      {project.result && (
                        <div>
                          <h4 className="text-lg font-semibold text-[var(--home-ink)] mb-3 flex items-center gap-2">
                            <span className="text-2xl">🎉</span>
                            The Results
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold text-[var(--home-ink-muted)] mb-2">Outcomes Achieved:</p>
                              <ul className="space-y-2">
                                {project.result.outcomes.map((outcome, index) => (
                                  <li key={index} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[var(--home-positive)] text-white flex items-center justify-center text-lg flex-shrink-0">
                                      ✓
                                    </div>
                                    <span className="text-[var(--home-ink-muted)] font-medium">{outcome}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {project.result.testimonial && (
                              <div className="p-6 bg-[var(--home-signal)]/5 rounded-lg border-2 border-[var(--home-rule)]">
                                <p className="text-lg text-[var(--home-ink-muted)] italic mb-4">"{project.result.testimonial.quote}"</p>
                                <div className="flex items-center gap-3">
                                  <div className="w-1 h-12 bg-gradient-to-b from-[var(--home-signal)] to-[var(--home-warning)]" />
                                  <div>
                                    <p className="font-semibold text-[var(--home-ink)]">{project.result.testimonial.author}</p>
                                    <p className="text-sm text-[var(--home-ink-muted)]">{project.result.testimonial.role}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {project.result.lessonsLearned && (
                              <div>
                                <p className="text-sm font-semibold text-[var(--home-ink-muted)] mb-2">Lessons Learned:</p>
                                <ul className="space-y-2">
                                  {project.result.lessonsLearned.map((lesson, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                      <div className="w-2 h-2 rounded-full bg-[var(--home-warning)] mt-2 flex-shrink-0" />
                                      <span className="text-[var(--home-ink-muted)]">{lesson}</span>
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
                <div className="flex gap-4 pt-4 border-t-2 border-[var(--home-rule)]">
                  {project.link && (
                    project.link.startsWith("/") ? (
                      <Link href={project.link}>
                        <ModernButton variant="primary" size="md">
                          <IconExternalLink className="w-4 h-4 inline mr-2" />
                          View Live Project
                        </ModernButton>
                      </Link>
                    ) : (
                      <a href={project.link} target="_blank" rel="noopener noreferrer">
                        <ModernButton variant="primary" size="md">
                          <IconExternalLink className="w-4 h-4 inline mr-2" />
                          View Live Project
                        </ModernButton>
                      </a>
                    )
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
