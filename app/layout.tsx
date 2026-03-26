import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata } from "next";
import { Instrument_Serif, Sora } from "next/font/google";
import type { ReactNode } from "react";

import Navbar from "../components/Navbar";
import SplashScreen from "../components/SplashScreen";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Gather - Group trip planner",
  description: "An editorial group trip planner for shared itineraries, votes, budgets, and travel notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`${sora.variable} ${instrumentSerif.variable} flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground antialiased`}
        >
          <ConvexClientProvider>
            <SplashScreen />
            <Navbar>{children}</Navbar>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
