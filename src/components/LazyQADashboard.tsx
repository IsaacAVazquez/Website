"use client";

import React from 'react';
import { useComponentLazyLoad } from '@/hooks/useLazyLoad';
import { GlassCard } from '@/components/ui/GlassCard';

const loadQADashboard = () => import('@/components/ui/QADashboard');

export function LazyQADashboard() {
  const { elementRef, Component, isLoading, error } = useComponentLazyLoad(loadQADashboard);

  return (
    <div ref={elementRef} className="min-h-[400px]">
      {isLoading && (
        <GlassCard elevation={2} className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-blue"></div>
            <span className="text-slate-400">Loading dashboard...</span>
          </div>
        </GlassCard>
      )}
      
      {error && (
        <GlassCard elevation={2} className="p-8">
          <div className="text-center text-error-red">
            Failed to load dashboard component
          </div>
        </GlassCard>
      )}
      
      {Component && <Component />}
    </div>
  );
}