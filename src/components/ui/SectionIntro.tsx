import React from "react";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";

interface SectionIntroProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  align?: "left" | "center";
  size?: "md" | "lg";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  actions,
  align = "left",
  size = "md",
  className,
  titleClassName,
  descriptionClassName,
}: SectionIntroProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "space-y-4",
        centered && "mx-auto text-center items-center",
        size === "lg" ? "max-w-4xl" : "max-w-3xl",
        className
      )}
    >
      {eyebrow ? (
        <div className={cn(centered && "flex justify-center")}>
          <span className="section-kicker">{eyebrow}</span>
        </div>
      ) : null}

      <Heading
        level={1}
        className={cn(
          size === "lg"
            ? "text-4xl sm:text-5xl lg:text-6xl leading-[1.02]"
            : "text-3xl sm:text-4xl lg:text-5xl leading-tight",
          titleClassName
        )}
      >
        {title}
      </Heading>

      {description ? (
        <Paragraph
          className={cn(
            "section-subtitle mb-0",
            centered && "mx-auto",
            descriptionClassName
          )}
        >
          {description}
        </Paragraph>
      ) : null}

      {actions ? (
        <div
          className={cn(
            "flex flex-wrap gap-3 pt-2",
            centered ? "justify-center" : "justify-start"
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
