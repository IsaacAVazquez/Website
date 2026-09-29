import { createEditorialOgImage } from "@/lib/og";
import { getAllBlogPostPreviews, getBlogPostPreviewBySlug } from "@/lib/blog";
import { getBlogClusterTheme, getBlogPostCollectionLabel } from "@/lib/blog-config";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Isaac Vazquez writing";

// One image per published article, drawn at build, matching the slugs the
// article page prerenders. Without it the route is dynamic, and a request for
// an article's share image measured about two seconds in production.
export function generateStaticParams() {
  return getAllBlogPostPreviews().map((post) => ({ slug: post.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostPreviewBySlug(slug);

  const eyebrow = getBlogPostCollectionLabel(post ?? undefined);
  const title = post?.title || "Writing";
  const description =
    post?.excerpt ||
    "Writing on PM workflows, AI products, fintech tools, and systems thinking.";

  return createEditorialOgImage({
    eyebrow,
    title,
    description,
    accent: getBlogClusterTheme(post?.cluster),
    footer: "isaacvazquez.com/writing",
  });
}
