// Design-sync bundle entry: the Working Instrument design-system surface.
// Hand-curated so the bundle ships exactly the DS layers (ui/ primitives,
// editorial/ kit, football/ dashboard kit) plus the preview provider — not the
// whole app tree. A new DS component must be added here AND in
// .design-sync/config.json componentSrcMap to be synced.

// Must evaluate before any next/* module (see file comment).
import "./process-shim";

// ui/ primitives
export * from "../src/components/ui/Badge";
export * from "../src/components/ui/Chip";
export * from "../src/components/ui/Heading";
export * from "../src/components/ui/Kicker";
export * from "../src/components/ui/MetricCallout";
export * from "../src/components/ui/ModernButton";
export * from "../src/components/ui/PageSummary";
export * from "../src/components/ui/Paragraph";
export * from "../src/components/ui/ReadoutPanel";
export * from "../src/components/ui/SectionIntro";
export * from "../src/components/ui/ThemeToggle";
export * from "../src/components/ui/WarmCard";
export * from "../src/components/ui/AuthorBio";
export * from "../src/components/ui/ExpertSignal";
export * from "../src/components/ui/JourneyTimeline";
export * from "../src/components/ui/OptimizedImage";
export * from "../src/components/ui/dropdown-menu";

// editorial/ kit
export * from "../src/components/editorial";

// football/ dashboard kit
export * from "../src/components/football";

// preview support (theme + router + image stand-ins for static renders)
export { PreviewProvider } from "./preview-support";
