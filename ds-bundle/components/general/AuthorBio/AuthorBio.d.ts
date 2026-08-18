import * as React from 'react';

/**
 * AuthorBio — from isaac-vazquez-portfolio@0.1.0.
 */
export interface AuthorBioProps {
  name?: string;
  title?: string;
  image?: string;
  bio?: string;
  credentials?: Array<string>;
  expertise?: Array<string>;
  social?: { linkedin?: string; github?: string; email?: string; website?: string };
  variant?: "inline" | "full" | "compact" | "light";
  showImage?: boolean;
  showSocial?: boolean;
  className?: string;
}

export declare const AuthorBio: React.ComponentType<AuthorBioProps>;
