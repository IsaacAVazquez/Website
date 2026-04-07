import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Article,
  BrandGithub,
  BrandLinkedin,
  Briefcase,
  Mail,
} from "@/components/ui/ServerIcons";
import type { CaseStudyData } from "@/constants/caseStudies";
import { getProjectCardProblem } from "@/constants/caseStudies";
import type { BlogPostPreview } from "@/lib/blog";
import { publishedDateFormatter } from "@/lib/utils";

interface HomePageContentProps {
  featuredProjects: CaseStudyData[];
  latestPosts: BlogPostPreview[];
}

function HomeProjectCard({
  project,
  index,
}: {
  project: CaseStudyData;
  index: number;
}) {
  const href = project.link ?? `/portfolio/${project.slug}`;
  const impact = project.overview.impact.trim() || project.metrics;
  const problem = getProjectCardProblem(project);

  return (
    <Link href={href} className="group block h-full">
      <article className="home-card home-project-card flex h-full flex-col">
        <div className="flex items-center justify-between gap-4">
            <span className="home-pill">Project {String(index + 1).padStart(2, "0")}</span>
          <ArrowRight className="h-4 w-4 text-[var(--home-ink-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--home-ink)]" />
        </div>

        <div className="mt-5 flex flex-1 flex-col gap-4">
            <h3 className="home-project-title">{project.title}</h3>
          <p className="home-body home-body-strong mb-0">{impact}</p>

          <div className="space-y-1">
            <p className="home-meta mb-0">Problem space</p>
            <p className="home-note-copy mb-0">{problem}</p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--home-rule)] pt-4">
            <p className="home-meta mb-0">{project.role}</p>
            <p className="home-meta mb-0">{project.timeline}</p>
          </div>
        </div>
      </article>
    </Link>
  );
}

function HomeWritingCard({ post }: { post: BlogPostPreview }) {
  return (
    <Link href={`/writing/${post.slug}`} className="group block h-full">
      <article className="home-card home-writing-card h-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="home-pill home-pill-dark">{post.category}</span>
          <time dateTime={post.publishedAt} className="home-meta home-meta-dark mb-0">
            {publishedDateFormatter.format(new Date(post.publishedAt))}
          </time>
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="home-writing-title">{post.title}</h3>
          <p className="home-writing-copy mb-0">{post.excerpt}</p>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-[var(--home-dark-rule)] pt-4">
          <p className="home-meta home-meta-dark mb-0">{post.readingTime}</p>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--home-dark-ink)]">
            Read it
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
}

export function HomePageContent({
  featuredProjects,
  latestPosts,
}: HomePageContentProps) {
  return (
    <div className="home-page">
      <section
        className="home-section home-hero-section"
        aria-labelledby="home-hero-heading"
        data-testid="hero"
      >
        <div className="home-shell">
          <div className="home-wordmark home-reveal mx-auto text-center">ISAAC VAZQUEZ</div>

          <div className="home-intro-block home-reveal home-reveal-delay-1">
            <p className="home-kicker">Product work, writing, and working tools</p>
            <p className="home-body home-intro-copy">
              Most of my work lives where judgment, analytics, and execution all
              have to hold together at the same time.
            </p>
          </div>

          <div className="home-hero-grid">
            <div className="home-reveal home-reveal-delay-2 lg:ml-auto">
              <h1 id="home-hero-heading" className="home-hero-title max-w-3xl">
                I build products that make hard problems easier to act on.
              </h1>
              <p className="home-body home-hero-body max-w-3xl">
                That shows up here as case studies, writing, and working tools
                across reliability, fintech, media, and sports data.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/portfolio" className="home-button home-button-secondary">
                  <Briefcase className="h-4 w-4" />
                  View projects
                </Link>
                <Link href="/about" className="home-button home-button-secondary">
                  <Article className="h-4 w-4" />
                  About
                </Link>
              </div>
            </div>

            <div className="home-reveal home-reveal-delay-3 flex justify-center lg:justify-end">
              <div className="home-headshot-frame">
                <Image
                  src="/images/headshot-home.webp"
                  alt="Isaac Vazquez"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="home-section"
        aria-labelledby="home-projects-heading"
        data-testid="home-projects"
      >
        <div className="home-shell">
          <div className="home-section-intro home-reveal">
            <div>
              <p className="home-kicker">Selected work</p>
              <h2 id="home-projects-heading" className="home-section-title mx-auto max-w-3xl">
                A few projects that show how I think about product work.
              </h2>
              <p className="home-body mx-auto max-w-3xl home-section-copy">
                Each one covers the role, the problem, and what actually changed once it shipped.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {featuredProjects.map((project, index) => (
              <HomeProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section
        className="home-section home-section-acid"
        aria-labelledby="home-spotlight-heading"
        data-testid="home-spotlight"
      >
        <div className="home-shell">
          <div className="grid items-stretch gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            <div className="home-reveal">
              <p className="home-kicker">Where I do my best work</p>
              <h2 id="home-spotlight-heading" className="home-manifesto">
                <span>A clearer</span>
                <span>way to make</span>
                <span>
                  ambitious <em>product</em>
                </span>
                <span>work feel usable.</span>
              </h2>
              <p className="home-body home-section-copy">
                I don&apos;t think product work gets stronger when it sounds more
                abstract. I think it gets stronger when the tradeoffs are
                legible, the scope is honest, and the product helps someone make
                a better decision without making them work harder for it.
              </p>
            </div>

            <div className="home-reveal home-reveal-delay-1 h-full">
              <div className="home-spotlight-board h-full" aria-hidden="true">
                <div className="home-spotlight-note w-fit">Point of view</div>
                <div className="home-spotlight-poster">
                  <span>Tradeoffs</span>
                  <span>legible.</span>
                  <span>Scope honest.</span>
                </div>
                <div className="home-spotlight-tags">
                  <span>Reliability</span>
                  <span>Analytics</span>
                  <span>Decision-making</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section
        className="home-section home-section-dark"
        aria-labelledby="home-writing-heading"
        data-testid="home-writing"
      >
        <div className="home-shell">
          <div className="home-section-intro home-section-intro-dark home-reveal">
            <div>
              <p className="home-kicker home-kicker-dark">Latest writing</p>
              <h2 id="home-writing-heading" className="home-section-title mx-auto max-w-3xl home-section-title-dark">
                I use the writing to unpack the reasoning behind the work.
              </h2>
            </div>
            <p className="home-body home-body-dark home-section-copy">
              Product strategy, analytics-heavy decisions, and the parts of the
              job that usually matter more than the framework language around
              them.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <HomeWritingCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section
        className="home-section home-contact-section"
        aria-labelledby="home-contact-heading"
        data-testid="home-contact"
      >
        <div className="home-shell">
          <div className="home-contact-panel home-reveal">
            <p className="home-kicker">Contact</p>
            <h2 id="home-contact-heading" className="home-section-title mx-auto max-w-3xl">
              If you&apos;re building something that needs judgment and
              follow-through, I&apos;d like to hear about it.
            </h2>
            <p className="home-body home-section-copy mx-auto max-w-2xl">
              I&apos;m especially interested in product, analytics, fintech, and
              workflow tools where clear thinking has to survive real delivery.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href="mailto:IsaacVazquez@berkeley.edu"
                className="home-button home-button-secondary"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
              <a
                href="https://github.com/IsaacAVazquez"
                target="_blank"
                rel="noopener noreferrer"
                className="home-button home-button-secondary"
              >
                <BrandGithub className="h-4 w-4" />
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/isaac-vazquez"
                target="_blank"
                rel="noopener noreferrer"
                className="home-button home-button-secondary"
              >
                <BrandLinkedin className="h-4 w-4" />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
