import { Sidebar } from "@/components/Sidebar";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { twMerge } from "tailwind-merge";
import { Footer } from "@/components/Footer";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { BackgroundEffects } from "@/components/BackgroundEffects"; // import your client component

const inter = Inter({
  subsets: ["latin"],
  weight: [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ],
});

export const metadata: Metadata = {
  title: "Isaac Vazquez – QA Engineer & Builder",
  description:
    "QA engineer, civic tech advocate, and data enthusiast. Isaac Vazquez crafts reliable, user-centered products for a better democracy.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Isaac Vazquez – QA Engineer & Builder",
    description:
      "QA engineer, civic tech advocate, and data enthusiast. Isaac Vazquez crafts reliable, user-centered products for a better democracy.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Isaac Vazquez – QA Engineer & Builder",
    description:
      "QA engineer, civic tech advocate, and data enthusiast. Isaac Vazquez crafts reliable, user-centered products for a better democracy.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth-dark">
      <head>
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
          "flex antialiased min-h-screen overflow-hidden bg-gradient-to-br from-teal-100 via-white to-violet-200 dark:from-[#101924] dark:via-[#121317] dark:to-[#27273d] text-neutral-900 dark:text-neutral-200"
        )}
      >
        <Sidebar />
        <div className="lg:pl-2 lg:pt-2 flex-1 overflow-y-auto relative">
          <BackgroundEffects /> {/* Only use the component here */}
          <div className="relative z-10 flex flex-col min-h-screen lg:rounded-tl-2xl border border-transparent lg:border-neutral-700/40 overflow-y-auto bg-white/90 dark:bg-neutral-950/85 backdrop-blur-xl shadow-2xl transition-colors duration-500">
            <div className="p-4 flex justify-end">
              <div className="hover:scale-110 transition-transform duration-200">
                <DarkModeToggle />
              </div>
            </div>
            <main className="flex-1 px-4 pb-8 animate-fadeIn">{children}</main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
