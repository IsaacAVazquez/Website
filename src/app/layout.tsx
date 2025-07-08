import "./globals.css";
import type { Metadata } from "next";
import { Inter, Syne, DM_Sans, JetBrains_Mono, Orbitron } from "next/font/google";
import { twMerge } from "tailwind-merge";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { ConditionalLayout } from "@/components/ConditionalLayout";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth-dark">
      <head>
        <StructuredData type="Person" />
        <StructuredData type="WebSite" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            })();`,
          }}
        />
      </head>
      <body
        className={twMerge(
          inter.className,
          inter.variable,
          syne.variable,
          dmSans.variable,
          jetbrainsMono.variable,
          orbitron.variable,
          "min-h-screen antialiased bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0A0A0B] dark:via-[#0F172A] dark:to-[#1E293B] text-slate-900 dark:text-slate-50"
        )}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}
