import * as React from "react";
import { ModernButton } from "isaac-vazquez-portfolio";

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <ModernButton variant="primary">Run projection</ModernButton>
    <ModernButton variant="secondary">Save draft board</ModernButton>
    <ModernButton variant="outline">Compare tiers</ModernButton>
    <ModernButton variant="ghost">Dismiss</ModernButton>
    <ModernButton variant="accent">Refresh snapshot</ModernButton>
    <ModernButton variant="mono">Download resume</ModernButton>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <ModernButton variant="primary" size="sm">
      sm · Add pick
    </ModernButton>
    <ModernButton variant="primary" size="md">
      md · Add pick
    </ModernButton>
    <ModernButton variant="primary" size="lg">
      lg · Add pick
    </ModernButton>
  </div>
);

export const AsLinks = () => (
  <div className="flex flex-wrap items-center gap-3">
    <ModernButton href="/portfolio" variant="accent" size="lg">
      See the work
    </ModernButton>
    <ModernButton href="/about" variant="outline" size="lg">
      More about me
    </ModernButton>
    <ModernButton href="https://github.com/IsaacAVazquez" variant="ghost" size="md">
      GitHub profile
    </ModernButton>
  </div>
);

export const States = () => (
  <div className="max-w-md space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <ModernButton variant="primary" disabled>
        Refreshing snapshot
      </ModernButton>
      <ModernButton variant="accent" disabled>
        Locked until kickoff
      </ModernButton>
    </div>
    <ModernButton type="submit" variant="primary" size="lg" fullWidth>
      Sign in
    </ModernButton>
  </div>
);
