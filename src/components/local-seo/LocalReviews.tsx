"use client";

import { useState } from "react";
import { BusinessLocation, googleBusinessProfile } from "@/lib/localSEO";
import { GlassCard } from "@/components/ui/GlassCard";
import { MorphButton } from "@/components/ui/MorphButton";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { 
  IconStar, 
  IconStarFilled, 
  IconExternalLink, 
  IconThumbUp, 
  IconQuote,
  IconMapPin,
  IconCalendar,
  IconUser
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface LocalReviewsProps {
  location: BusinessLocation;
  variant?: 'full' | 'summary' | 'testimonials';
  className?: string;
}

interface Review {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  platform: 'google' | 'yelp' | 'linkedin' | 'direct';
  verified: boolean;
  helpful?: number;
  response?: string;
}

// Sample reviews data (replace with actual review API integration)
const sampleReviews: Record<string, Review[]> = {
  'austin-tx': [
    {
      id: '1',
      author: 'Maria Rodriguez',
      location: 'Austin, TX',
      rating: 5,
      date: '2024-01-15',
      title: 'Exceptional QA Expertise',
      content: 'Isaac\'s quality assurance work on our Austin-based healthcare platform was outstanding. His attention to detail and understanding of local compliance requirements saved us months of potential issues. Highly recommend for any Austin tech company.',
      platform: 'google',
      verified: true,
      helpful: 8
    },
    {
      id: '2',
      author: 'David Chen',
      location: 'Round Rock, TX',
      rating: 5,
      date: '2024-01-10',
      title: 'Product Strategy Excellence',
      content: 'Working with Isaac on our product strategy was a game-changer. His combination of technical QA background and strategic thinking helped us launch successfully in the competitive Austin market.',
      platform: 'linkedin',
      verified: true,
      helpful: 12,
      response: 'Thank you David! It was a pleasure working with your team on the product launch. Excited to see your continued success in the Austin market.'
    },
    {
      id: '3',
      author: 'Jennifer Williams',
      location: 'Cedar Park, TX',
      rating: 5,
      date: '2023-12-20',
      title: 'Reliable Testing Services',
      content: 'Isaac provided comprehensive testing services for our Austin startup. His local knowledge and technical expertise made the entire process smooth and professional.',
      platform: 'google',
      verified: true,
      helpful: 6
    }
  ],
  'bay-area-ca': [
    {
      id: '4',
      author: 'Sarah Kim',
      location: 'San Francisco, CA',
      rating: 5,
      date: '2024-01-18',
      title: 'Strategic Business Insights',
      content: 'Isaac\'s UC Berkeley MBA perspective brought valuable strategic insights to our Bay Area fintech startup. His quality assurance background combined with business acumen is exactly what we needed.',
      platform: 'linkedin',
      verified: true,
      helpful: 15
    },
    {
      id: '5',
      author: 'Michael Park',
      location: 'Palo Alto, CA',
      rating: 5,
      date: '2024-01-12',
      title: 'Top-Tier Consultation',
      content: 'Exceptional consultation on product quality and strategy. Isaac understands the high standards required in Silicon Valley and delivers accordingly.',
      platform: 'google',
      verified: true,
      helpful: 9,
      response: 'Thank you Michael! Silicon Valley\'s innovation demands the highest quality standards, and I\'m glad I could help your team achieve them.'
    }
  ]
};

export function LocalReviews({ location, variant = 'full', className = '' }: LocalReviewsProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const reviews = sampleReviews[location.id] || [];
  
  const filteredReviews = selectedPlatform === 'all' 
    ? reviews 
    : reviews.filter(review => review.platform === selectedPlatform);

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 : 0
  }));

  if (variant === 'summary') {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white mb-2">Client Reviews</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <IconStarFilled 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(averageRating) ? 'text-warning-amber' : 'text-slate-600'}`} 
                  />
                ))}
              </div>
              <span className="text-white font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-slate-400 text-sm">({reviews.length} reviews)</span>
            </div>
          </div>
          <IconMapPin className="w-5 h-5 text-electric-blue" />
        </div>
        
        <p className="text-slate-300 text-sm mb-4">
          Trusted by businesses across {location.address.addressLocality} and surrounding areas.
        </p>
        
        <div className="flex space-x-2">
          <MorphButton 
            href={googleBusinessProfile.generateBusinessProfileUrl(location)}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="outline"
          >
            <IconExternalLink className="w-4 h-4 mr-2" />
            View All Reviews
          </MorphButton>
          <MorphButton 
            href="/contact"
            size="sm"
            variant="primary"
          >
            Get Started
          </MorphButton>
        </div>
      </GlassCard>
    );
  }

  if (variant === 'testimonials') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center">
          <Heading level={2} className="mb-4">
            What {location.address.addressLocality} Clients Say
          </Heading>
          <Paragraph className="text-slate-400 max-w-2xl mx-auto">
            Real feedback from businesses across {location.address.addressLocality} and the greater {location.address.addressRegion} area.
          </Paragraph>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <IconStarFilled 
                        key={i} 
                        className={`w-4 h-4 ${i < review.rating ? 'text-warning-amber' : 'text-slate-600'}`} 
                      />
                    ))}
                  </div>
                  <Badge variant="outline" size="sm">
                    {review.platform}
                  </Badge>
                </div>
                
                <blockquote className="flex-1 mb-4">
                  <IconQuote className="w-5 h-5 text-electric-blue/50 mb-2" />
                  <p className="text-slate-300 text-sm italic">"{review.content}"</p>
                </blockquote>
                
                <footer className="text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <IconUser className="w-4 h-4 text-slate-400" />
                    <cite className="text-white font-medium not-italic">{review.author}</cite>
                    {review.verified && (
                      <Badge variant="matrix" size="sm">Verified</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <IconMapPin className="w-3 h-3" />
                    <span className="text-xs">{review.location}</span>
                    <IconCalendar className="w-3 h-3 ml-2" />
                    <span className="text-xs">{new Date(review.date).toLocaleDateString()}</span>
                  </div>
                </footer>
                
                {review.helpful && (
                  <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-electric-blue/10">
                    <IconThumbUp className="w-3 h-3 text-matrix-green" />
                    <span className="text-xs text-slate-400">{review.helpful} found helpful</span>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <MorphButton 
            href={googleBusinessProfile.generateBusinessProfileUrl(location)}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
          >
            <IconExternalLink className="w-4 h-4 mr-2" />
            Read All Reviews
          </MorphButton>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Reviews Overview */}
      <GlassCard className="p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Client Reviews & Testimonials
            </h2>
            <div className="flex items-center space-x-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-warning-amber">{averageRating.toFixed(1)}</div>
                <div className="flex items-center justify-center mb-1">
                  {[...Array(5)].map((_, i) => (
                    <IconStarFilled 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.floor(averageRating) ? 'text-warning-amber' : 'text-slate-600'}`} 
                    />
                  ))}
                </div>
                <div className="text-sm text-slate-400">{reviews.length} reviews</div>
              </div>
              <div className="flex-1">
                <p className="text-slate-300 mb-2">
                  Based on reviews from clients across {location.address.addressLocality}, {location.address.addressRegion}
                </p>
                <div className="flex space-x-2">
                  <Badge variant="matrix">{reviews.filter(r => r.verified).length} Verified</Badge>
                  <Badge variant="electric">{location.address.addressLocality} Local</Badge>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-white mb-4">Rating Distribution</h3>
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm text-slate-300">{rating}</span>
                    <IconStar className="w-4 h-4 text-warning-amber" />
                  </div>
                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-warning-amber h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Platform Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            selectedPlatform === 'all' 
              ? 'bg-electric-blue/20 text-electric-blue border border-electric-blue/40' 
              : 'bg-terminal-bg/30 text-slate-400 hover:text-white'
          }`}
        >
          All Platforms ({reviews.length})
        </button>
        {['google', 'linkedin', 'yelp'].map(platform => {
          const count = reviews.filter(r => r.platform === platform).length;
          if (count === 0) return null;
          
          return (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors capitalize ${
                selectedPlatform === platform 
                  ? 'bg-electric-blue/20 text-electric-blue border border-electric-blue/40' 
                  : 'bg-terminal-bg/30 text-slate-400 hover:text-white'
              }`}
            >
              {platform} ({count})
            </button>
          );
        })}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-electric-blue/20 rounded-full flex items-center justify-center">
                    <span className="text-electric-blue font-semibold">
                      {review.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-white">{review.author}</h4>
                      {review.verified && (
                        <Badge variant="matrix" size="sm">Verified</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-400">
                      <IconMapPin className="w-3 h-3" />
                      <span>{review.location}</span>
                      <span>•</span>
                      <span>{new Date(review.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <IconStarFilled 
                        key={i} 
                        className={`w-4 h-4 ${i < review.rating ? 'text-warning-amber' : 'text-slate-600'}`} 
                      />
                    ))}
                  </div>
                  <Badge variant="outline" size="sm">
                    {review.platform}
                  </Badge>
                </div>
              </div>

              {review.title && (
                <h5 className="font-medium text-white mb-3">{review.title}</h5>
              )}

              <blockquote className="text-slate-300 mb-4 leading-relaxed">
                "{review.content}"
              </blockquote>

              <div className="flex items-center justify-between">
                {review.helpful && (
                  <div className="flex items-center space-x-2">
                    <IconThumbUp className="w-4 h-4 text-matrix-green" />
                    <span className="text-sm text-slate-400">{review.helpful} found helpful</span>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <MorphButton size="sm" variant="ghost">
                    Helpful
                  </MorphButton>
                </div>
              </div>

              {review.response && (
                <div className="mt-4 p-4 bg-terminal-bg/30 rounded-lg border-l-4 border-electric-blue">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-electric-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-electric-blue font-semibold text-sm">IV</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-white">Isaac Vazquez</span>
                        <Badge variant="electric" size="sm">Owner</Badge>
                      </div>
                      <p className="text-slate-300 text-sm">{review.response}</p>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Call to Action */}
      <GlassCard className="p-8 text-center bg-matrix-green/5 border-matrix-green/20">
        <IconStar className="w-12 h-12 text-matrix-green mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Ready to Join Our Happy Clients?
        </h3>
        <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
          Experience the same quality service that our {location.address.addressLocality} clients rave about. 
          Get started with a free consultation today.
        </p>
        <div className="flex justify-center space-x-4">
          <MorphButton href="/contact" variant="primary">
            Get Free Consultation
          </MorphButton>
          <MorphButton 
            href={googleBusinessProfile.generateReviewsUrl('PLACE_ID_HERE')}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
          >
            <IconExternalLink className="w-4 h-4 mr-2" />
            Leave a Review
          </MorphButton>
        </div>
      </GlassCard>
    </div>
  );
}