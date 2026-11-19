import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import ThemeProvider from "@/components/ThemeProvider";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { SITE } from "@/lib/site";
import AppShell from "@/components/AppShell";

const sans = Inter({
  variable: "--font-sans-stack",
  subsets: ["latin"],
  display: "swap",
});

/** Monospace carries the formulas, so it needs good coverage of ŷ, σ, λ, ‖ and ·. */
const mono = JetBrains_Mono({
  variable: "--font-mono-stack",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#06070d" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8fc" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* data-scroll-behavior: Next 16 no longer forces scroll-behavior to auto on
       navigation, and globals.css sets `smooth` for in-page anchors. */
    <html
      lang="en"
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} antialiased`}
    >
      <body>
        {/* Runs before hydration and outside React, so the theme is set before
            first paint and React never renders a <script> element. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
