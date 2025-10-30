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
      logo: "/images/logos/fsu-logo.png",
      description: "Graduated with degrees in Political Science and International Affairs, building foundation for strategic thinking",
      achievement: "Developed analytical and research skills that inform data-driven decision making",
      techStack: ["Research", "Policy Analysis", "International Relations", "Strategic Thinking"],
      milestone: "Foundation for career bridging technology and social impact"
    },
    {
      year: 2019,
      role: "Digital and Communications Intern",
      company: "Open Progress",
      logo: "/images/logos/open-progress-logo.png",
      description: "Launched career in civic tech, developing data-driven user acquisition strategies for progressive campaigns",
      achievement: "5x growth in user base through personalized email campaigns and A/B testing frameworks",
      techStack: ["Email Marketing", "A/B Testing", "User Acquisition", "Analytics"],
      milestone: "Discovered passion for data-driven civic impact and digital strategy"
    },
    {
      year: 2020,
      role: "Digital and Data Associate",
      company: "Open Progress",
      logo: "/images/logos/open-progress-logo.png",
      description: "Transformed client analytics from manual reporting to automated ETL pipelines with interactive dashboards",
      achievement: "Reduced decision-making time by 40%, optimized user segmentation improving conversion by 25%",
      techStack: ["SQL", "Sisense", "Tableau", "ETL Pipelines", "Data Analytics"],
      milestone: "Became data and digital communications strategist for political campaigns"
    },
    {
      year: 2021,
      role: "Client Services Manager",
      company: "Open Progress",
      logo: "/images/logos/open-progress-logo.png",
      description: "Orchestrated delivery of 80+ digital programs, establishing milestones and aligning cross-functional teams",
      achievement: "100% on-time delivery, 25% higher engagement through data-driven messaging strategy",
      techStack: ["Project Management", "Data Analytics", "Stakeholder Management", "Campaign Strategy"],
      milestone: "Mastered cross-functional collaboration and strategic program management"
    },
    {
      year: 2022,
      role: "Quality Assurance Analyst",
      company: "CIVITECH",
      logo: "/images/logos/civitech-logo.png",
      description: "Transitioned into QA, championing product reliability initiatives across civic tech platforms",
      achievement: "Achieved 99.999% uptime, improved release efficiency by 30% through comprehensive testing",
      techStack: ["Manual Testing", "Automated Testing", "Jira", "Quality Strategy"],
      milestone: "Found calling in quality assurance and product-focused technology"
    },
    {
      year: 2023,
      role: "Quality Assurance Analyst",
      company: "CIVITECH",
      logo: "/images/logos/civitech-logo.png",
      description: "Led cross-functional pricing strategy initiative, aligning engineering, sales, and finance teams around product value",
      achievement: "Generated $4M additional revenue through market analysis, financial modeling, and strategic dashboards",
      techStack: ["Product Strategy", "Financial Modeling", "Market Analysis", "Cross-functional Leadership"],
      milestone: "Evolved into product-focused strategist with business impact"
    },
    {
      year: 2024,
      role: "Quality Assurance Analyst",
      company: "CIVITECH",
      logo: "/images/logos/civitech-logo.png",
      description: "Owned end-to-end product vision for TextOut platform through user research, requirements definition, and feature prioritization",
      achievement: "Drove 35% engagement increase, transformed client data accessibility with GCP automation reducing onboarding by 90%",
      techStack: ["User Research", "Product Vision", "GCP", "Feature Prioritization", "Analytics"],
      milestone: "Demonstrated product management capabilities at scale"
    },
    {
      year: 2025,
      role: "Quality Assurance Engineer",
      company: "CIVITECH",
      logo: "/images/logos/civitech-logo.png",
      description: "Drove successful launch of RunningMate platform, translating cross-functional feedback into user stories and quality acceptance criteria",
      achievement: "Reduced critical defects by 90%, increased NPS from 23 to 36, accelerated releases from monthly to biweekly",
      techStack: ["Product Development", "DevOps Integration", "AI/LLM Tools", "Release Management"],
      milestone: "Architected quality strategy at organizational scale with AI-powered workflows"
    },
    {
      year: 2025,
      role: "MBA Candidate",
      company: "UC Berkeley Haas",
      logo: "/images/logos/berkeley-logo.png",
      description: "Pursuing MBA to deepen product management expertise and explore venture capital opportunities in civic tech and SaaS",
      achievement: "Consortium Fellow, MLT Professional Development Fellow, serving as MLT Ambassador",
      techStack: ["Product Management", "Strategy", "Venture Capital", "Leadership", "Fintech"],
      milestone: "Transitioning from product-focused technologist to product management leader"
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