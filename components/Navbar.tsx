"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { ArrowUpRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { signOut } = useAuthActions();
  const pathname = usePathname();
  const isTripPage = pathname.startsWith("/trip/");

  return (
    <nav className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="mx-auto flex h-[4.8rem] max-w-7xl items-center justify-between rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,12,16,0.9),rgba(4,5,7,0.78))] px-4 shadow-[0_26px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[0.66rem] font-bold uppercase tracking-[0.24em] text-black">
              G
            </span>
            <span className="font-sans text-[1.45rem] font-extrabold tracking-[-0.05em] text-white sm:text-[1.65rem]">
              Gather
            </span>
          </Link>
          <span className="hidden rounded-full border border-white/12 bg-white/[0.06] px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/62 lg:inline">
            {isTripPage ? "Trip notebook" : "Shared trip planning"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Authenticated>
            <button
              onClick={() => void signOut()}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.11]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </Authenticated>

          <Unauthenticated>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-white/90"
            >
              Sign in
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Unauthenticated>
        </div>
      </div>
    </nav>
  );
}
