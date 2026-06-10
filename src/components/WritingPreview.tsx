"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { IconArrowRight } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface PostPreview {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingTime: string;
}

export function WritingPreview() {
  const shouldReduceMotion = useReducedMotion();
  const [posts, setPosts] = useState<PostPreview[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/search?type=blog&limit=3");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results)) {
            setPosts(
              data.results.slice(0, 3).map((p: Record<string, string>) => ({
                slug: p.slug,
                title: p.title,
                excerpt: p.excerpt || p.description || "",
                publishedAt: p.publishedAt || p.date || "",
                readingTime: p.readingTime || "",
              }))
            );
          }
        }
      } catch {
        // Silently fail — section will just be hidden
      }
    }
    fetchPosts();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.5 },
    },
  };

  // Don't render the section if no posts are available
  if (posts.length === 0) return null;

  return (
    <section
      className="py-16 md:py-24 bg-[var(--home-paper)]"
      aria-label="Product thinking and writing"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="mb-10">
            <Heading level={2} className="mb-4">
              Product Thinking
            </Heading>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid md:grid-cols-3 gap-6 mb-10"
          >
            {posts.map((post) => (
              <Link key={post.slug} href={`/writing/${post.slug}`}>
                <WarmCard padding="md" hover className="h-full group">
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-[var(--home-ink)] group-hover:text-[var(--home-haze)] transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-[var(--home-ink-muted)] line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-[var(--home-ink-soft)]">
                      {post.publishedAt && (
                        <span>
                          {new Date(post.publishedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      )}
                      {post.readingTime && <span>{post.readingTime}</span>}
                    </div>
                  </div>
                </WarmCard>
              </Link>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="text-center">
            <ModernButton href="/writing" variant="outline" size="lg">
              Read More
              <IconArrowRight className="h-4 w-4" />
            </ModernButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
