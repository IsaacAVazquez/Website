export const profile = {
  name: "Isaac Vazquez",
  givenName: "Isaac",
  familyName: "Vazquez",
  alternateNames: ["IsaacAVazquez"],
  shortTitle: "MBA Candidate",
  fullTitle: "UC Berkeley Haas MBA Candidate",
  description:
    "Isaac Vazquez is a second-year Berkeley Haas MBA candidate moving into product, with six years in campaign data and QA and a 2026 growth internship at Juno.",
  disambiguatingDescription:
    "UC Berkeley Haas MBA candidate based in Berkeley, California, moving into product roles after six years across civic technology, QA, analytics, and SaaS.",
  shortDescription:
    "UC Berkeley Haas MBA candidate with a background in QA, analytics, and product work across SaaS, civic tech, and fintech-style tools.",
  location: {
    locality: "Berkeley",
    region: "CA",
    country: "US",
    market: "San Francisco Bay Area",
  },
  email: "IsaacVazquez@berkeley.edu",
  // Only profiles a crawler can open. x.com/isaacvazquez returned "User Profile
  // Not Found" on 2026-09-24, so it came out of the Person entity.
  sameAs: {
    github: "https://github.com/IsaacAVazquez",
    linkedin: "https://www.linkedin.com/in/isaac-vazquez/",
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
      url: "https://haas.berkeley.edu/",
      degree: "Master of Business Administration",
      startDate: "2025-08",
      endDate: "2027-05",
    },
    {
      "@type": "CollegeOrUniversity" as const,
      name: "Florida State University",
      description: "Bachelor of Arts - Political Science and International Affairs",
      url: "https://www.fsu.edu/",
      degree: "Bachelor of Arts",
      endDate: "2018",
    },
  ],
};

export const profileSameAs = Object.values(profile.sameAs);
