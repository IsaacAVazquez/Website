"use client";

import { careerTimeline } from "@/constants/personal";
import Image from "next/image";
import {
  IconBriefcase,
  IconSchool,
  IconTrendingUp,
  IconRocket,
} from "@tabler/icons-react";

interface TimelineItemProps {
  item: typeof careerTimeline[0];
  isLast: boolean;
}

const renderTimelineIcon = (company: string) => {
  const lower = company.toLowerCase();
  const className = "w-5 h-5";
  const style = { color: "var(--home-ink-muted)" } as const;
  if (lower.includes("florida state")) return <IconSchool className={className} style={style} />;
  if (lower.includes("open progress")) return <IconTrendingUp className={className} style={style} />;
  if (lower.includes("berkeley") || lower.includes("haas")) return <IconRocket className={className} style={style} />;
  return <IconBriefcase className={className} style={style} />;
};

const TimelineItem = ({ item, isLast }: TimelineItemProps) => {
  return (
    <div className="flex gap-6">
      {/* Left: logo + connecting line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="rounded-full overflow-hidden"
          style={{
            background: "color-mix(in srgb, var(--home-paper-alt) 80%, var(--home-elev-mix))",
            border: "1px solid var(--home-rule)",
          }}
        >
          {item.logo ? (
            <Image
              src={item.logo}
              alt={`${item.company} logo`}
              width={36}
              height={36}
              className="object-contain"
            />
          ) : (
            renderTimelineIcon(item.company)
          )}
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 my-2"
            style={{ background: "var(--home-rule)" }}
          />
        )}
      </div>

      {/* Right: content */}
      <div className="flex-1 pb-10">
        <p className="home-kicker mb-1">{item.year}</p>
        <h3
          className="font-bold mb-0.5"
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "1.1rem",
            letterSpacing: "-0.02em",
            color: "var(--home-ink)",
          }}
        >
          {item.role}
        </h3>
        <p
          className="mb-3"
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "0.88rem",
            fontWeight: 600,
            color: "var(--home-ink-muted)",
          }}
        >
          {item.company}
        </p>
        <p
          className="mb-4"
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "0.95rem",
            lineHeight: 1.65,
            color: "var(--home-ink-muted)",
          }}
        >
          {item.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {item.techStack.map((tech) => (
            <span key={tech} className="resume-chip">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export function JourneyTimeline() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="home-card home-project-card space-y-5">
        <p className="home-kicker">Journey</p>
        <p className="home-body max-w-none">
          I started in political science, moved into data and campaign work, and found my way to product through quality engineering. Here&apos;s how that path unfolded.
        </p>

        <div className="pt-2">
          {careerTimeline.map((item, index) => (
            <TimelineItem
              key={`${item.year}-${item.role}`}
              item={item}
              isLast={index === careerTimeline.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
