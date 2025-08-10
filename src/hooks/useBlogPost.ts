import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface BlogPostMeta {
  title: string;
  slug: string;
}

export function useBlogPost() {
  const pathname = usePathname();
  const [blogPost, setBlogPost] = useState<BlogPostMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we're on a blog post page
    const blogPostMatch = pathname.match(/^\/blog\/([^\/]+)$/);
    
    if (blogPostMatch) {
      const slug = blogPostMatch[1];
      setIsLoading(true);
      
      // Fetch blog post metadata for breadcrumbs
      fetch(`/api/blog/${slug}/meta`)
        .then(res => res.json())
        .then(data => {
          if (data.title) {
            setBlogPost({ title: data.title, slug });
          }
        })
        .catch(error => {
          console.error('Failed to fetch blog post meta:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setBlogPost(null);
    }
  }, [pathname]);

  return {
    blogPost,
    isLoading,
    isBlogPost: pathname.startsWith('/blog/') && pathname !== '/blog'
  };
}