"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconExternalLink, IconBrandGithub, IconClock, IconTargetArrow } from '@tabler/icons-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { MorphButton } from '@/components/ui/MorphButton';
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
            <GlassCard
              elevation={5}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-terminal-bg/90 backdrop-blur-sm border-b border-terminal-border p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${project.color}`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100">{project.title}</h2>
                    {project.timeline && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <IconClock className="w-4 h-4" />
                        <span className="text-sm">{project.timeline}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-terminal-border rounded-lg transition-colors"
                >
                  <IconX className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Screenshot */}
                {project.screenshot && (
                  <div className="relative rounded-lg overflow-hidden border border-terminal-border">
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
                  <p className="text-lg text-slate-300 leading-relaxed">{project.description}</p>
                </div>

                {/* Tech Stack */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3">Technology Stack</h3>
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
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">Key Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.detailedMetrics.map((metric, index) => (
                        <div key={index} className="p-4 bg-terminal-bg/50 rounded-lg border border-terminal-border">
                          <div className="text-sm text-slate-400 mb-1">{metric.label}</div>
                          <div className="text-2xl font-bold text-electric-blue mb-1">{metric.value}</div>
                          {metric.improvement && (
                            <div className="text-sm text-matrix-green">{metric.improvement}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenges */}
                {project.challenges && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">Technical Challenges</h3>
                    <ul className="space-y-2">
                      {project.challenges.map((challenge, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-warning-amber mt-2 flex-shrink-0" />
                          <span className="text-slate-300">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Impact */}
                {project.impact && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                      <IconTargetArrow className="w-5 h-5 text-matrix-green" />
                      Business Impact
                    </h3>
                    <div className="p-4 bg-matrix-green/10 border border-matrix-green/20 rounded-lg">
                      <p className="text-slate-300">{project.impact}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-terminal-border">
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer">
                      <MorphButton
                        variant="primary"
                        icon={<IconExternalLink className="w-4 h-4" />}
                        iconPosition="left"
                      >
                        View Live Project
                      </MorphButton>
                    </a>
                  )}
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer">
                      <MorphButton
                        variant="secondary"
                        icon={<IconBrandGithub className="w-4 h-4" />}
                        iconPosition="left"
                      >
                        View Code
                      </MorphButton>
                    </a>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}