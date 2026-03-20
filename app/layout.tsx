import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Manrope,
} from "next/font/google";
import AppChrome from "../components/AppChrome";
import LenisProvider from "../components/LenisProvider";
import SplashScreen from "../components/SplashScreen";
import { ConvexClientProvider } from "./ConvexClientProvider";
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
          className={`${manrope.variable} ${cormorant.variable} flex min-h-dvh flex-col bg-background text-foreground antialiased`}
        >
          <ConvexClientProvider>
            <SplashScreen />

            <LenisProvider>
              <AppChrome>{children}</AppChrome>
            </LenisProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
