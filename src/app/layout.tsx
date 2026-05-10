import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/components/register-sw";
import { Toaster } from "sonner";
import { getLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Viessmann B2B Loyalty",
  description: "Loyalty programme for Viessmann installers in Croatia.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Viessmann B2B",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff3e17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the locale once on the server so the <html lang> attribute is
  // correct on first paint and every client component below shares the same
  // value via I18nProvider.
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RegisterSW />
        <I18nProvider locale={locale}>{children}</I18nProvider>
        <Toaster
          position="bottom-center"
          theme="light"
          duration={3500}
          gap={8}
          offset={16}
          // Mobile installer pages have a bottom nav (~58 px) with a floating
          // Submit FAB protruding ~24 px above it, plus the iOS safe-area
          // inset. Push the toast above the whole stack with breathing room.
          mobileOffset={100}
          visibleToasts={3}
          toastOptions={{
            classNames: {
              toast: "v-toast",
              title: "v-toast-title",
              description: "v-toast-desc",
              icon: "v-toast-icon",
              success: "v-toast--success",
              error: "v-toast--error",
              warning: "v-toast--warning",
              info: "v-toast--info",
            },
          }}
        />
      </body>
    </html>
  );
}

// Mark the root layout as dynamic. Reading the locale cookie via `cookies()`
// already opts us into request-time rendering, but making it explicit prevents
// any future build-time optimisation from caching a stale lang.
export const dynamic = "force-dynamic";
