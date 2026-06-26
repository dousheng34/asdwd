import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import LanguageProvider from "@/components/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asyk.kz | Marketplace of Gaming Values",
  description: "Secure peer-to-peer escrow marketplace for gaming items, skins, currency, accounts and boosting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground grid-pattern relative overflow-x-hidden selection:bg-primary/30 selection:text-white">
        {/* Subtle orange ambient glow in the background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none radial-glow z-0" />
        
        <LanguageProvider>
          <Navbar />
          
          <main className="flex-grow flex flex-col relative z-10">
            {children}
          </main>

          <footer className="border-t border-white/5 bg-background relative z-10 py-8 text-center text-xs text-zinc-500">
            <div className="container mx-auto px-4">
              <p className="mb-2">© {new Date().getFullYear()} Asyk.kz. All rights reserved.</p>
              <p className="max-w-md mx-auto text-[10px] text-zinc-600">
                Asyk.kz is a secure trading platform. In-game content, logos and trademarks are properties of their respective owners.
              </p>
            </div>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
