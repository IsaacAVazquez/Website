export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  content: string;
  rating: number;
  date: string;
  category: 'qa-engineering' | 'fantasy-football' | 'software-development' | 'collaboration';
  project?: string;
  featured?: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    name: 'Sarah Chen',
    role: 'Senior Product Manager',
    company: 'TechFlow Solutions',
    content: 'Isaac transformed our QA process completely. His attention to detail and systematic approach to testing helped us reduce bugs by 80% and improve our release cycle from monthly to weekly. His automation frameworks are still the backbone of our testing strategy.',
    rating: 5,
    date: '2024-02-15',
    category: 'qa-engineering',
    project: 'E-commerce Platform Testing',
    featured: true
  },
  {
    id: 'testimonial-2',
    name: 'Mike Rodriguez',
    role: 'Fantasy Football Commissioner',
    company: 'Austin Tech League',
    content: 'Isaac\'s fantasy football analytics completely changed how our league operates. His tier charts and player evaluation tools helped everyone make better decisions, and the weekly insights became must-read content for all 12 teams.',
    rating: 5,
    date: '2024-01-20',
    category: 'fantasy-football',
    featured: true
  },
  {
    id: 'testimonial-3',
    name: 'Jennifer Park',
    role: 'Engineering Director',
    company: 'DataVision Inc',
    content: 'Working with Isaac on our quality assurance initiatives was exceptional. He not only identified critical issues but also provided comprehensive solutions and training that elevated our entire team\'s testing capabilities.',
    rating: 5,
    date: '2024-03-10',
    category: 'qa-engineering',
    project: 'Enterprise Dashboard QA'
  },
  {
    id: 'testimonial-4',
    name: 'Alex Thompson',
    role: 'Lead Developer',
    company: 'StartupXYZ',
    content: 'Isaac\'s code review process and quality standards helped us build more reliable software from day one. His experience in QA engineering translated into better development practices across our entire team.',
    rating: 5,
    date: '2024-01-05',
    category: 'software-development',
    project: 'MVP Development & Testing'
  },
  {
    id: 'testimonial-5',
    name: 'Lisa Johnson',
    role: 'Fantasy Analyst',
    company: 'DraftKings Content',
    content: 'Isaac\'s fantasy football analytics methodology is incredibly sophisticated. His data-driven approach and visualization tools provided insights that traditional analysis missed completely. Highly recommend his analytical work.',
    rating: 5,
    date: '2023-12-15',
    category: 'fantasy-football'
  },
  {
    id: 'testimonial-6',
    name: 'David Kumar',
    role: 'CTO',
    company: 'FinTech Solutions',
    content: 'Isaac brings a unique perspective to software quality that goes beyond traditional testing. His systematic approach to identifying edge cases and performance bottlenecks saved us from several critical issues before launch.',
    rating: 5,
    date: '2024-02-28',
    category: 'software-development',
    featured: true
  },
  {
    id: 'testimonial-7',
    name: 'Rachel Martinez',
    role: 'Project Manager',
    company: 'Austin Digital Agency',
    content: 'Isaac is incredibly collaborative and communicative. He made complex QA concepts accessible to our non-technical stakeholders and always delivered thorough documentation and clear reporting.',
    rating: 5,
    date: '2024-01-30',
    category: 'collaboration',
    project: 'Multi-platform Web Application'
  },
  {
    id: 'testimonial-8',
    name: 'Chris Wilson',
    role: 'Fantasy League Manager',
    company: 'Corporate Fantasy League',
    content: 'The custom analytics dashboard Isaac built for our company fantasy league was incredible. Real-time stats, player projections, and trade analysis tools that made managing our 16-team league effortless.',
    rating: 5,
    date: '2023-11-20',
    category: 'fantasy-football',
    project: 'Corporate League Analytics Platform'
  }
];

// Utility functions for testimonials
export function getFeaturedTestimonials(): Testimonial[] {
  return testimonials.filter(t => t.featured);
}

export function getTestimonialsByCategory(category: Testimonial['category']): Testimonial[] {
  return testimonials.filter(t => t.category === category);
}

export function getRandomTestimonials(count: number = 3): Testimonial[] {
  const shuffled = [...testimonials].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRecentTestimonials(count: number = 5): Testimonial[] {
  return testimonials
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}