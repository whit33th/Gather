import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Manrope,
} from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "./ConvexClientProvider";
import SplashScreen from "../components/SplashScreen";
import AppShell from "../components/AppShell";
import LenisProvider from "../components/LenisProvider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gather - Group trip planner",
  description: "An editorial group trip planner for shared itineraries, votes, budgets, and travel notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`${manrope.variable} ${cormorant.variable} bg-background text-foreground antialiased`}
        >
          <ConvexClientProvider>
            <SplashScreen />

            <LenisProvider>
              <AppShell>{children}</AppShell>
            </LenisProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
