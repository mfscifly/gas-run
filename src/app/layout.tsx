import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = "Gas Run";
const HOME_TITLE = "Gas Run: cross-border gas savings and border wait times";
const SITE_DESCRIPTION =
  "Compare US/Canada gas prices, estimate cross-border fuel savings, and check live wait times at every Canada-US land crossing.";

export const metadata: Metadata = {
  // Absolute base for the og:image / twitter:image URLs Next generates from
  // the opengraph-image and twitter-image files.
  metadataBase: new URL(SITE_URL),
  title: HOME_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1226" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-[env(safe-area-inset-bottom)]">
        <header className="border-b border-line">
          <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-5">
            <Link
              href="/"
              className="-ml-1 inline-flex items-center gap-2.5 px-1 py-1 text-[15px] font-medium tracking-tight"
            >
              <LogoMark className="h-6 w-6" />
              Gas Run
            </Link>
            <span className="label-mono">Canada – US</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-6">
            <span className="text-sm">Built by Daniel</span>
            <span className="label-mono">Data: CBP · CBSA · StatCan · EIA</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
