import type { Metadata } from "next";
import { Geist_Mono, SUSE } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Footer } from "@/components/footer";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const suse = SUSE({
  variable: "--font-suse",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Naisho",
  description:
    "Confidently pass secrets, API keys, and environment variables with secure peer-to-peer WebRTC",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` ${geistMono.variable} ${suse.variable} antialiased md:min-h-screen min-h-[100dvh] flex flex-col`}
      >
        <QueryProvider>
          <main className="flex-1">
            <NuqsAdapter>{children}</NuqsAdapter>
          </main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
