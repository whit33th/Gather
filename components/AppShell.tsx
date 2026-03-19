"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { ArrowUpRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Navbar() {
  const { signOut } = useAuthActions();
  const pathname = usePathname();
  const isTripPage = pathname.startsWith("/trip/");

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-900/6 bg-white/92 backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-sans text-[1.8rem] font-semibold tracking-[-0.05em] text-stone-950">
            Gather
          </Link>
          <span className="hidden text-sm text-stone-400 lg:inline">
            {isTripPage ? "Trip notebook" : "Shared trip planning"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Authenticated>
            <button
              onClick={() => void signOut()}
              className="editorial-button-secondary px-4 py-2.5 text-[0.72rem]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </Authenticated>

          <Unauthenticated>
            <Link href="/login" className="editorial-button-primary px-4 py-2.5 text-[0.72rem]">
              Sign in
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Unauthenticated>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-stone-900/6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-stone-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p className="font-medium text-stone-900">Gather</p>
        <p>Shared place for destinations, dates, decisions, budgets, and the group chat around the trip.</p>
      </div>
    </footer>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalone = pathname === "/login" || pathname.startsWith("/invite/");

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
