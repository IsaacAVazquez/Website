import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import {
  Mail,
  BrandLinkedin,
  BrandGithub,
  Download,
} from "@/components/ui/ServerIcons";
import { SectionIntro } from "@/components/ui/SectionIntro";

const contactMethods = [
  {
    icon: Mail,
    label: "Email",
    value: "IsaacVazquez@berkeley.edu",
    href: "mailto:IsaacVazquez@berkeley.edu",
  },
  {
    icon: BrandLinkedin,
    label: "LinkedIn",
    value: "/in/isaac-vazquez",
    href: "https://linkedin.com/in/isaac-vazquez",
    external: true,
  },
  {
    icon: BrandGithub,
    label: "GitHub",
    value: "@isaacavazquez",
    href: "https://github.com/isaacavazquez",
    external: true,
  },
];

export function ContactSection() {
  return (
    <section id="contact" className="page-section bg-[var(--surface-primary)]">
      <div className="page-shell-tight text-center">
        <div>
          <div className="section-panel px-6 py-8 sm:px-8 sm:py-10">
            <SectionIntro
              eyebrow="Contact"
              align="center"
              headingLevel={2}
              title="Interested in working together?"
              description="If you&apos;re hiring for product work or want to talk through a project, I&apos;d be glad to connect."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {contactMethods.map((method) => (
                <a
                  key={method.label}
                  href={method.href}
                  {...(method.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="block"
                >
                  <WarmCard padding="md" hover className="h-full text-center">
                    <method.icon className="mx-auto mb-4 h-10 w-10 text-[var(--color-primary)]" />
                    <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">
                      {method.label}
                    </h3>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {method.value}
                    </span>
                  </WarmCard>
                </a>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
              <ModernButton href="/contact" variant="accent" size="lg">
                <Mail className="h-5 w-5" />
                Get in touch
              </ModernButton>
              <ModernButton
                href="/Isaac_Vazquez_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="lg"
              >
                <Download className="h-5 w-5" />
                Download resume
              </ModernButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
