/**
 * Lightweight inline SVG icons for server components.
 * Keeps an icon dependency out of server bundles, and supplies the brand marks
 * (GitHub, LinkedIn) that lucide-react does not ship.
 * SVG paths sourced from Tabler Icons (MIT license).
 */

interface IconProps {
  className?: string;
  size?: number | string;
  "aria-hidden"?: boolean | "true" | "false";
}

const defaultProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function svgProps(props: IconProps) {
  const { className, size, "aria-hidden": ariaHidden } = props;
  return {
    ...defaultProps,
    className,
    ...(size != null ? { width: size, height: size } : {}),
    ...(ariaHidden != null ? { "aria-hidden": ariaHidden } : {}),
  };
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M5 12l14 0" />
      <path d="M13 18l6 -6" />
      <path d="M13 6l6 6" />
    </svg>
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M5 12l14 0" />
      <path d="M5 12l6 6" />
      <path d="M5 12l6 -6" />
    </svg>
  );
}

export function ExternalLink(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
      <path d="M11 13l9 -9" />
      <path d="M15 4h5v5" />
    </svg>
  );
}

export function Search(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
      <path d="M21 21l-6 -6" />
    </svg>
  );
}

export function BrandGithub(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
    </svg>
  );
}

export function Mail(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
      <path d="M3 7l9 6l9 -6" />
    </svg>
  );
}

export function X(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function BrandLinkedin(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
      <path d="M8 11l0 5" />
      <path d="M8 8l0 .01" />
      <path d="M12 16l0 -5" />
      <path d="M16 16v-3a2 2 0 0 0 -4 0" />
    </svg>
  );
}
