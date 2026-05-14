import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileGate from "../components/MobileGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TRECC Protocol",
  description: "Trustless Reputation & Evaluation Credit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen flex flex-col`}>
        <Providers>
          <MobileGate>
            <div className="sticky font-bold top-0 z-50 w-full bg-zinc-800/80 border-b border-zinc-700/50 py-1.5 text-center text-[11px] tracking-wide text-zinc-400">
              Private Beta — Testnet only
            </div>
            <Navbar />
            <main className="flex-grow flex flex-col pt-24">{children}</main>
            <Footer />
          </MobileGate>
        </Providers>
      </body>
    </html>
  );
}