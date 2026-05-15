import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./provider";
import Navbar from "../components/Navbar";
import MobileGate from "../components/MobileGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TRECC",
  description: "Trustless Reputation & Evaluation Credit",
  icons: {
    icon: [
      { url: "/favicon.png?v=trecc-2", type: "image/png" },
      { url: "/favicon.ico?v=trecc-2", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico?v=trecc-2",
    apple: "/favicon.png?v=trecc-2",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png?v=trecc-2" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico?v=trecc-2" />
        <link rel="apple-touch-icon" href="/favicon.png?v=trecc-2" />
      </head>
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen flex flex-col`}>
        <Providers>
          <MobileGate>
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <main className="flex-grow flex flex-col">{children}</main>
          </MobileGate>
        </Providers>
      </body>
    </html>
  );
}
