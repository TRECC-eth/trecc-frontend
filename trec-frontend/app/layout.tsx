import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
          <Navbar />
          <main className="flex-grow flex flex-col pt-24">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}