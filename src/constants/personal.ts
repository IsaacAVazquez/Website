export const personalMetrics = {
  experience: {
    yearsInQA: 6,
    yearsInTech: 8,
    bugsSquashed: 2847,
    testsWritten: 12500,
    releasesShipped: 127,
    systemsSecured: 45,
    votersReached: 60000000,
    uptimeAchieved: 99.9,
    coffeeConsumed: 3650, // cups per year * years
    lateNightDeployments: 89,
    codeCoverageImproved: 35, // percentage points
    teamsMentored: 12,
  },
  
  achievements: [
    {
      title: "Zero-Defect Releases",
      description: "Shipped 15 consecutive releases without critical bugs",
      icon: "🎯",
      year: 2024,
      impact: "Increased user trust by 40%"
    },
    {
      title: "Automation Champion",
      description: "Reduced manual testing time by 70% through smart automation",
      icon: "🤖",
      year: 2023,
      impact: "Saved 200+ hours per sprint"
    },
    {
      title: "Security Guardian",
      description: "Prevented 3 major security vulnerabilities from reaching production",
      icon: "🛡️",
      year: 2024,
      impact: "Protected 60M+ user records"
    },
    {
      title: "Performance Optimizer",
      description: "Improved app load times by 60% through rigorous testing",
      icon: "⚡",
      year: 2023,
      impact: "Enhanced user experience significantly"
    },
    {
      title: "Quality Evangelist",
      description: "Established QA culture across 4 cross-functional teams",
      icon: "📊",
      year: 2024,
      impact: "Improved overall code quality by 45%"
    }
  ],

  skills: {
    technical: [
      { name: "Test Automation", level: 95, category: "automation" },
      { name: "SQL/Database Testing", level: 90, category: "data" },
      { name: "API Testing", level: 88, category: "backend" },
      { name: "Security Testing", level: 85, category: "security" },
      { name: "Performance Testing", level: 82, category: "performance" },
      { name: "CI/CD Integration", level: 80, category: "devops" },
      { name: "Mobile Testing", level: 75, category: "mobile" },
      { name: "Accessibility Testing", level: 78, category: "frontend" }
    ],
    soft: [
      { name: "Problem Solving", level: 98, category: "analytical" },
      { name: "Communication", level: 92, category: "interpersonal" },
      { name: "Team Leadership", level: 85, category: "leadership" },
      { name: "Stakeholder Management", level: 88, category: "business" },
      { name: "Process Improvement", level: 90, category: "optimization" },
      { name: "Mentoring", level: 83, category: "teaching" }
    ]
  },

  personalityTraits: [
    {
      trait: "Perfectionist",
      description: "I obsess over details others might miss",
      debugOutput: "WARNING: Perfectionist mode enabled. May spend 3 hours on a single test case.",
      severity: "high"
    },
    {
      trait: "Problem Solver",
      description: "I see bugs as puzzles waiting to be solved",
      debugOutput: "INFO: Problem-solving algorithms running at 100% efficiency.",
      severity: "info"
    },
    {
      trait: "Empathetic Tester",
      description: "I test from the user's perspective, not just the code's",
      debugOutput: "SUCCESS: User empathy module loaded successfully.",
      severity: "success"
    },
    {
      trait: "Curiosity Driven",
      description: "I ask 'what if' until I break things creatively",
      debugOutput: "VERBOSE: Curiosity levels exceeding normal parameters.",
      severity: "warning"
    },
    {
      trait: "Resilient",
      description: "I thrive under pressure and tight deadlines",
      debugOutput: "STATUS: Stress resistance at maximum capacity.",
      severity: "info"
    }
  ],

  systemSpecs: {
    cpu: {
      name: "Isaac Brain v2.0",
      cores: "Multi-threaded Problem Solving",
      speed: "Variable (Coffee Dependent)",
      cache: "6+ years of QA experience"
    },
    memory: {
      ram: "Unlimited learning capacity",
      storage: "Extensive bug pattern recognition",
      swap: "Quick context switching between projects"
    },
    network: {
      connections: "Strong team collaboration protocols",
      bandwidth: "High-speed communication with stakeholders",
      latency: "Low response time to critical issues"
    },
    peripherals: {
      keyboard: "Terminal-optimized for efficiency",
      mouse: "Precision clicking for bug reproduction",
      display: "Eagle-eye attention to detail",
      audio: "Finely tuned for system alerts"
    }
  },

  funFacts: [
    "I've found bugs in my sleep (literally)",
    "My coffee-to-code ratio is scientifically optimized",
    "I can spot a UI misalignment from 20 feet away",
    "I've debugged issues while hiking Texas trails",
    "My test cases have test cases",
    "I dream in SQL queries and regex patterns",
    "I've taught my cat to be a better QA tester than some humans",
    "My browser bookmarks are 80% testing tools"
  ],

  currentStatus: {
    learning: "Advanced automation frameworks",
    reading: "The Art of Software Testing (again)",
    building: "Personal QA toolkit",
    exploring: "AI-powered testing strategies",
    availability: "Open to new challenges",
    mood: "Optimistically debugging life"
  },

  personalApis: {
    "/api/personality": {
      method: "GET",
      description: "Returns core personality traits and values",
      response: "Detail-oriented, empathetic, problem-solver"
    },
    "/api/hobbies": {
      method: "GET", 
      description: "Current interests and activities",
      response: "Cooking, hiking, election organizing, tech meetups"
    },
    "/api/philosophy": {
      method: "GET",
      description: "Core beliefs about QA and technology",
      response: "Quality isn't just testing—it's building trust"
    },
    "/api/availability": {
      method: "GET",
      description: "Current availability for opportunities",
      response: "Open to QA leadership roles and civic tech projects"
    },
    "/api/coffee": {
      method: "POST",
      description: "Increase productivity and debugging efficiency",
      response: "Productivity boosted. Bug-finding abilities enhanced."
    },
    "/api/debug": {
      method: "GET",
      description: "Debug mode for personal insights",
      response: "Verbose logging enabled. Quirks and easter eggs revealed."
    }
  },

  careerTimeline: [
    {
      year: 2018,
      role: "Bachelor of Arts Graduate",
      company: "Florida State University",
      description: "Graduated magna cum laude with degrees in Political Science and International Affairs",
      achievement: "Phi Beta Kappa, President's List, Dean's List honors",
      techStack: ["Research", "Analysis", "Writing", "International Relations"],
      milestone: "Foundation for strategic thinking and analysis"
    },
    {
      year: 2019,
      role: "Digital and Communications Intern",
      company: "Open Progress",
      description: "Launched career in civic tech with focus on digital voter engagement",
      achievement: "Grew client email fundraising lists by over 500%",
      techStack: ["Email Marketing", "Campaign Analytics", "Digital Strategy"],
      milestone: "Discovered passion for data-driven civic impact"
    },
    {
      year: 2020,
      role: "Digital and Data Associate",
      company: "Open Progress",
      description: "Designed and maintained intuitive data dashboards for real-time campaign insights",
      achievement: "Improved campaign decision-making speed by 40%",
      techStack: ["SQL", "Tableau", "Data Analysis", "Campaign Metrics"],
      milestone: "Became a data and digital communications strategist for political campaigns"
    },
    {
      year: 2021,
      role: "Client Services Manager",
      company: "Open Progress",
      description: "Led multi-channel voter engagement campaigns across 80+ digital programs",
      achievement: "Maintained 100% on-time delivery, drove 40M+ actionable voter conversations",
      techStack: ["Project Management", "Data Analytics", "Client Relations", "Scale Operations"],
      milestone: "Mastered scaling operations and stakeholder management"
    },
    {
      year: 2022,
      role: "Quality Assurance Analyst",
      company: "CIVITECH",
      description: "Transitioned to QA with mission to secure democratic technology platforms",
      achievement: "Achieved near 100% uptime and 30% increase in release efficiency",
      techStack: ["Manual Testing", "Test Planning", "Bug Tracking", "Jira"],
      milestone: "Found calling in quality assurance and civic technology"
    },
    {
      year: 2023,
      role: "Quality Assurance Analyst",
      company: "CIVITECH",
      description: "Scaled QA processes across multiple development phases and products",
      achievement: "Executed 400+ tests, identified product opportunities leading to 20% engagement increase",
      techStack: ["JMeter", "Postman", "Cypress", "Performance Testing", "User Research"],
      milestone: "Became product-focused QA strategist"
    },
    {
      year: 2024,
      role: "Quality Assurance Analyst",
      company: "CIVITECH",
      description: "Served as primary driver for product vision through user behavior analysis",
      achievement: "Shaped TextOut feature set, reaching 60M+ unique voters in 2024",
      techStack: ["User Analytics", "Product Strategy", "Cross-functional Collaboration"],
      milestone: "Released two major applications with zero critical bugs",
    },
    {
      year: 2025,
      role: "Quality Assurance Engineer",
      company: "CIVITECH",
      description: "Leading organization-wide release governance and automation framework design",
      achievement: "Reduced critical production defects by 50% QoQ, cut regression time by 2 days",
      techStack: ["DevOps Integration", "Security Workflows", "Release Management", "Automation"],
      milestone: "Architecting quality at organizational scale"
    },
    {
      year: 2025,
      role: "MBA Candidate",
      company: "UC Berkeley Haas",
      description: "Pursuing MBA to bridge technology expertise with strategic business thinking",
      achievement: "Consortium Fellow, expanding impact beyond technology",
      techStack: ["Strategy", "Product Management", "Consulting", "Leadership"],
      milestone: "Broadening impact through business education"
    }
  ],

  philosophy: {
    qa: "Quality isn't just about finding bugs—it's about building trust, protecting users, and ensuring technology serves humanity's best interests.",
    career: "I believe in the power of meticulous attention to detail combined with empathetic understanding of user needs.",
    life: "Every system can be improved, every process can be optimized, and every challenge is an opportunity to learn and grow.",
    teamwork: "The best QA work happens when testing is everyone's responsibility, not just the QA team's.",
    impact: "Technology should empower people and strengthen communities. Quality assurance is how we make that promise real."
  }
};