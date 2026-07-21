import * as React from 'react';

/**
 * StatusPanel — from isaac-vazquez-portfolio@0.1.0.
 */
export interface StatusPanelProps {
  title: string;
  message: string;
  tone?: "default" | "warning" | "error";
  icon?: React.ReactNode;
  statusRole?: "alert" | "status";
  action?: React.ReactNode;
}

export declare const StatusPanel: React.ComponentType<StatusPanelProps>;
