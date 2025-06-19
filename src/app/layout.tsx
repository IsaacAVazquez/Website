import { Sidebar } from "@/components/Sidebar";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { twMerge } from "tailwind-merge";
import { Footer } from "@/components/Footer";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Isaac Vazquez - QA Engineer",
  description:
    "Isaac Vazquez is a QA engineer and data enthusiast focused on civic technology.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={twMerge(
          inter.className,
          "flex antialiased h-screen overflow-hidden bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-200"
        )}
      >
        <Sidebar />
        <div className="lg:pl-2 lg:pt-2 flex-1 overflow-y-auto">
          <div className="flex-1 min-h-screen lg:rounded-tl-xl border border-transparent lg:border-neutral-700/50 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
            <div className="p-4 flex justify-end">
              <DarkModeToggle />
            </div>
            {children}
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
