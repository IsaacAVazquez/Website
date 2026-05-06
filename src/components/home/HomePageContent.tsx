import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Article,
  BrandGithub,
  BrandLinkedin,
  Briefcase,
  ChartBar,
  FileText,
  Mail,
} from "@/components/ui/ServerIcons";
import type { CaseStudyData } from "@/constants/caseStudies";
import { getProjectCardProblem } from "@/constants/caseStudies";
import type { BlogPostPreview } from "@/lib/blog";
import { publishedDateFormatter } from "@/lib/utils";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";

interface HomePageContentProps {
  featuredProjects: CaseStudyData[];
  proofOfWorkPosts: BlogPostPreview[];
  heroIndex: {
    projectCount: number;
    essayCount: number;
    liveToolCount: number;
  };
  latestPost: BlogPostPreview | null;
  featuredEssay: BlogPostPreview | null;
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
      <article className="home-card home-writing-card flex h-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="home-pill home-pill-dark">{post.category}</span>
          <time dateTime={post.publishedAt} className="home-meta home-meta-dark mb-0">
            {publishedDateFormatter.format(new Date(post.publishedAt))}
          </time>
        </div>

        <div className="mt-8 flex flex-1 flex-col gap-4">
          <h3 className="home-writing-title">{post.title}</h3>
          <p className="home-writing-copy mb-0">{post.excerpt}</p>

          <div className="mt-auto flex items-center justify-between border-t border-[var(--home-dark-rule)] pt-4">
            <p className="home-meta home-meta-dark mb-0">{post.readingTime}</p>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--home-dark-ink)]">
              Read it
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function HomePageContent({
  featuredProjects,
  proofOfWorkPosts,
  heroIndex,
  latestPost,
  featuredEssay,
}: HomePageContentProps) {
  const recentProject = featuredProjects[0];
  const practiceCells: HomeStatsCell[] = [
    {
      label: "Projects shipped",
      tooltip: "Case studies, live tools, and shipped product surfaces",
      value: heroIndex.projectCount,
      sub: "Across portfolio + tools",
    },
    {
      label: "Essays written",
      tooltip: "Long-form essays in the writing archive",
      value: heroIndex.essayCount,
      sub: "Plus shorter notes",
    },
    {
      label: "Live tools",
      tooltip: "Interactive tools currently in production",
      value: heroIndex.liveToolCount,
      sub: "Fintech · analytics · fantasy",
    },
    latestPost
      ? {
          label: "Most recent writing",
          tooltip: "Last published essay or note",
          value: latestPost.title,
          sub: publishedDateFormatter.format(new Date(latestPost.publishedAt)),
        }
      : {
          label: "Most recent writing",
          tooltip: "Last published essay or note",
          value: "Coming soon",
        },
    recentProject
      ? {
          label: "Most recent project",
          tooltip: "Most recently shipped case study",
          value: recentProject.title,
          sub: recentProject.timeline,
        }
      : {
          label: "Most recent project",
          tooltip: "Most recently shipped case study",
          value: "In progress",
        },
    {
      label: "MBA",
      tooltip: "Berkeley Haas full-time MBA program",
      value: (
        <>
          Berkeley Haas <em>&apos;25</em>
        </>
      ),
      sub: "Product · fintech focus",
    },
    {
      label: "Based",
      tooltip: "Primary location",
      value: "Berkeley, CA",
      sub: "Remote-friendly",
    },
    {
      label: "Focus",
      tooltip: "Where I spend my product time",
      value: "Product · AI · fintech",
      sub: "PM, agentic workflows, decision tools",
    },
  ];

  return (
    <div className="home-page">
      <section
        className="home-section home-hero-section"
        aria-labelledby="home-hero-heading"
        data-testid="hero"
      >
        <div className="home-shell">
          <h2
            className="home-wordmark home-reveal"
            aria-label="Isaac Vazquez"
          >
            ISAAC VAZQUEZ
          </h2>

          <div className="home-hero-meta-strip home-reveal home-reveal-delay-1">
            <div className="home-hero-meta-cell">
              <span className="home-hero-meta-lbl">Role</span>
              <span className="home-hero-meta-val">
                Product manager <em>&amp;</em> builder
              </span>
            </div>
            <div className="home-hero-meta-cell">
              <span className="home-hero-meta-lbl">Focus</span>
              <span className="home-hero-meta-val">
                AI workflows · Fintech · Analytics
              </span>
            </div>
            <div className="home-hero-meta-cell">
              <span className="home-hero-meta-lbl">Based</span>
              <span className="home-hero-meta-val">
                Berkeley, CA · Haas MBA &apos;27
              </span>
            </div>
            <div className="home-hero-meta-cell">
              <span className="home-hero-meta-lbl">Index</span>
              <span className="home-hero-meta-val">
                {heroIndex.projectCount} projects · {heroIndex.essayCount} essays ·{" "}
                {heroIndex.liveToolCount} live tools
              </span>
            </div>
          </div>

          <div className="home-hero-grid">
            <div className="home-hero-copy home-reveal home-reveal-delay-2">
              <div className="home-hero-copy-stack">
                <p className="home-kicker mb-0">Product work, writing, and live tools</p>
                <h1 id="home-hero-heading" className="home-hero-title">
                  I build products that make hard problems <em>easier</em> to act on.
                </h1>
                <p className="home-body home-hero-body">
                  Most of my work lives where product judgment, AI workflows,
                  and clear decision support have to hold together at the same
                  time. Case studies, PM-focused writing, and interactive
                  fintech and analytics tools built to make complex choices
                  easier to inspect.
                </p>
              </div>

              <div className="home-hero-actions">
                <Link href="/portfolio" className="home-button home-button-secondary">
                  <Briefcase className="h-4 w-4" />
                  View projects
                </Link>
                <Link href="/writing" className="home-button home-button-secondary">
                  <Article className="h-4 w-4" />
                  Read writing
                </Link>
                <span
                  className="home-hero-now-pill"
                  role="status"
                  aria-label="Available for new work"
                >
                  <span className="home-hero-now-dot" aria-hidden="true" />
                  Available for new work
                </span>
              </div>
            </div>

            <div className="home-hero-aside home-reveal home-reveal-delay-3">
              <div className="home-headshot-frame">
                {/*
                 * unoptimized: the source is already a hand-tuned 90KB webp
                 * and the Netlify image optimizer pipeline behind Cloudflare
                 * has been returning 502s for this asset, breaking the hero
                 * on prod. Serving the static file directly bypasses the
                 * broken transform without changing visual output.
                 */}
                <Image
                  src="/images/headshot-home.webp"
                  alt="Isaac Vazquez"
                  fill
                  className="object-cover object-top"
                  priority
                  unoptimized
                />
                <div className="home-headshot-caption" aria-hidden="true">
                  <span>Berkeley, CA</span>
                  <span className="home-headshot-caption-dot" />
                  <span>Open to roles</span>
                </div>
              </div>

              <div className="home-hero-aside-chips">
                {latestPost ? (
                  <Link
                    href={`/writing/${latestPost.slug}`}
                    className="home-hero-aside-chip group"
                  >
                    <span className="home-hero-aside-chip-lbl">Latest</span>
                    <span className="home-hero-aside-chip-val">{latestPost.title}</span>
                  </Link>
                ) : (
                  <div className="home-hero-aside-chip">
                    <span className="home-hero-aside-chip-lbl">Latest</span>
                    <span className="home-hero-aside-chip-val">New writing in progress</span>
                  </div>
                )}
                {featuredEssay && featuredEssay.slug !== latestPost?.slug ? (
                  <Link
                    href={`/writing/${featuredEssay.slug}`}
                    className="home-hero-aside-chip group"
                  >
                    <span className="home-hero-aside-chip-lbl">Writing</span>
                    <span className="home-hero-aside-chip-val">{featuredEssay.title}</span>
                  </Link>
                ) : (
                  <Link href="/writing" className="home-hero-aside-chip group">
                    <span className="home-hero-aside-chip-lbl">Writing</span>
                    <span className="home-hero-aside-chip-val">
                      Essays on PM, AI workflows, and fintech tools
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section" data-testid="home-practice-stats">
        <div className="home-shell">
          <HomeStatsPanel
            id="practice-stats"
            title="Practice at a glance"
            meta="Updated weekly"
            cells={practiceCells}
            pills={[
              { label: "Selected projects", href: "/portfolio", icon: Briefcase },
              { label: "Writing archive", href: "/writing", icon: Article },
              { label: "Investments tracker", href: "/investments", icon: ChartBar },
              { label: "Email", href: "/contact", icon: Mail },
              { label: "Résumé", href: "/resume", icon: FileText },
            ]}
          />
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
                Product surfaces that show how I think in practice.
              </h2>
              <p className="home-body mx-auto max-w-3xl home-section-copy">
                Fintech tools, research workflows, and data-heavy products where the tradeoffs need to stay legible.
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
                <span>ambitious</span>
                <span><em>product</em></span>
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
              <div className="home-spotlight-board" aria-hidden="true">
                <div className="home-spotlight-note">Point of view</div>
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
              <p className="home-kicker home-kicker-dark">Proof of work</p>
              <h2 id="home-writing-heading" className="home-section-title mx-auto max-w-3xl home-section-title-dark">
                Writing that shows how I think about PM, AI workflows, and fintech tools.
              </h2>
            </div>
            <p className="home-body home-body-dark home-section-copy">
              These are the pieces I would send first if you wanted to see how I frame discovery, agentic products, and decision-support tooling.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {proofOfWorkPosts.map((post) => (
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
