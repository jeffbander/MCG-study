import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCG Study Forms App - Protocol SB-ACS-005",
  description: "Clinical research form generator for MCG Study Protocol SB-ACS-005",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>
            <header className="fixed top-0 left-0 right-0 bg-slate-800/95 backdrop-blur border-b border-slate-700 z-50">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-lg font-semibold text-white">MCG Study App</h1>
                  <SignedIn>
                    <a href="/dashboard" className="text-slate-300 hover:text-white text-sm transition-colors">
                      Dashboard
                    </a>
                    <a href="/" className="text-slate-300 hover:text-white text-sm transition-colors">
                      New Patient
                    </a>
                  </SignedIn>
                </div>
                <div className="flex items-center gap-3">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        Sign In
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "w-9 h-9"
                        }
                      }}
                      afterSignOutUrl="/sign-in"
                    />
                  </SignedIn>
                </div>
              </div>
            </header>
            <main className="pt-16">
              {children}
            </main>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
