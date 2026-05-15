import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import AppChrome from "../components/AppChrome";

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
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
