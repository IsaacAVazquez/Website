import { createEditorialOgImage } from "@/lib/og";
import { getBlogPostPreviewBySlug } from "@/lib/blog";
import { getBlogClusterTheme, getBlogPostCollectionLabel } from "@/lib/blog-config";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Isaac Vazquez writing";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostPreviewBySlug(slug);

  const eyebrow = getBlogPostCollectionLabel(post);
  const title = post?.title || "Writing";
  const description =
    post?.excerpt ||
    "Writing on PM workflows, AI products, fintech tools, and systems thinking.";

  return createEditorialOgImage({
    eyebrow,
    title,
    description,
    accent: getBlogClusterTheme(post?.cluster),
    footer: "isaacavazquez.com/writing",
  });
}
