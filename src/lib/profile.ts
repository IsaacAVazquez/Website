export const profile = {
  name: "Isaac Vazquez",
  shortTitle: "Product Manager",
  fullTitle: "Product Manager & UC Berkeley Haas MBA Candidate",
  description:
    "Product manager with a QA-to-product background and 6+ years across SaaS, analytics, and civic tech. Builds AI workflow, fintech, and decision-support products.",
  shortDescription:
    "UC Berkeley Haas MBA candidate with a background in QA, analytics, and product work across SaaS, civic tech, and fintech-style tools.",
  location: {
    locality: "Berkeley",
    region: "CA",
    country: "US",
    market: "San Francisco Bay Area",
  },
  email: "IsaacVazquez@berkeley.edu",
  sameAs: {
    twitter: "https://twitter.com/isaacvazquez",
    github: "https://github.com/IsaacAVazquez",
    linkedin: "https://www.linkedin.com/in/isaac-vazquez/",
  },
  currentRole: {
    title: "Innovation Consultant Team Lead",
    organization: "Haas@Work",
    startDate: "2026-01",
  },
  formerEmployer: {
    name: "Civitech",
    url: "https://civitech.io",
    description:
      "Civic technology company focused on voter engagement and public-interest digital infrastructure.",
    startDate: "2022-01",
    endDate: "2025-08",
  },
  credentials: [
    "UC Berkeley Haas MBA Candidate '27",
    "Consortium Fellow",
    "MLT Professional Development Fellow",
    "6+ years across QA, analytics, and product work",
  ],
  knowsAbout: [
    "Product Management",
    "Product Strategy",
    "AI Workflows",
    "Agentic AI Products",
    "Quality Engineering",
    "Test Automation",
    "Data Analytics",
    "Fintech Product Development",
    "Investment Research Tools",
    "Civic Technology",
    "Cross-functional Leadership",
    "User Research",
  ],
  education: [
    {
      "@type": "CollegeOrUniversity" as const,
      name: "UC Berkeley Haas School of Business",
      description: "MBA Candidate (Class of 2027)",
      degree: "Master of Business Administration",
      startDate: "2025-08",
      endDate: "2027-05",
    },
    {
      "@type": "CollegeOrUniversity" as const,
      name: "Florida State University",
      description: "Bachelor of Arts - Political Science and International Affairs",
      degree: "Bachelor of Arts",
      endDate: "2018",
    },
  ],
};

export const profileSameAs = Object.values(profile.sameAs);
