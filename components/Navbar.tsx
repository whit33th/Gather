"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { ArrowUpRight, Home, Menu, Search, Settings2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { api } from "../convex/_generated/api";
import type { ThemePreset } from "../lib/theme";
import { cn } from "../lib/utils";
import AppShellBackground from "./AppShellBackground";
import { AppThemeProvider } from "./AppThemeProvider";
import LenisProvider from "./LenisProvider";
import UserAvatar from "./UserAvatar";

type AppNavItem = {
  href: Route;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
};

function SidebarLink({
  href,
  label,
  description,
  icon: Icon,
  active,
  onNavigate,
}: AppNavItem & {
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex w-full justify-start gap-2 rounded-4xl px-4 py-3.5",
        active ? "border-white/24 bg-white/[0.07] text-white" : "text-white/72 hover:text-white",
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.04]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium tracking-[-0.03em]">{label}</span>
        <span className="mt-0.5 block truncate text-[0.68rem] uppercase tracking-[0.14em] text-white/42">
          {description}
        </span>
      </span>
    </Link>
  );
}

export default function Navbar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const currentUser = useQuery(api.users.current);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [backgroundFallbackUrl, setBackgroundFallbackUrl] = useState<string | null>(null);
  const themePreset = (currentUser?.themePreset || "forest") as ThemePreset;
  const backgroundImageUrl =
    currentUser?.useTripCoverBackground
      ? currentUser.backgroundTrip
        ? currentUser.backgroundTrip.coverUrl ?? null
        : backgroundFallbackUrl
      : null;

  useEffect(() => {
    const syncFallback = () => {
      try {
        setBackgroundFallbackUrl(window.localStorage.getItem("gather:lastTripCover"));
      } catch {
        setBackgroundFallbackUrl(null);
      }
    };

    syncFallback();
    window.addEventListener("storage", syncFallback);
    window.addEventListener("gather:lastTripCoverChanged", syncFallback);

    return () => {
      window.removeEventListener("storage", syncFallback);
      window.removeEventListener("gather:lastTripCoverChanged", syncFallback);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const body = document.body;

    if (!currentUser) {
      root.removeAttribute("data-theme-preset");
      body.removeAttribute("data-theme-preset");
      return;
    }

    root.setAttribute("data-theme-preset", themePreset);
    body.setAttribute("data-theme-preset", themePreset);
  }, [currentUser, themePreset]);

  const navItems = useMemo<AppNavItem[]>(
    () => [
      {
        href: "/" as Route,
        label: "Trips",
        description: "All notebooks",
        icon: Home,
        active:
          pathname === "/" ||
          pathname.startsWith("/trip/") ||
          pathname.startsWith("/settings"),
      },
      {
        href: "/discover" as Route,
        label: "Discover",
        description: "Trip ideas",
        icon: Search,
        active: pathname.startsWith("/discover"),
      },
    ],
    [pathname],
  );

  const navLinks = navItems.map((item) => (
    <SidebarLink key={item.href} {...item} onNavigate={() => setMobileNavOpen(false)} />
  ));

  const authPanel = isLoading || currentUser === undefined ? (
    <div className="z-51 rounded-[1.55rem] border border-white/10 p-4">
      <div className="h-12 animate-pulse rounded-[1rem] bg-white/6" />
    </div>
  ) : currentUser ? (
    <div className="z-51 rounded-[1.55rem] border border-white/10 p-4">
      <div className="flex items-center gap-3">
        <UserAvatar
          name={currentUser.name || "Traveler"}
          image={currentUser.image}
          seed={currentUser._id}
          size={44}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium tracking-[-0.03em] text-white">
            {currentUser.name || "Traveler"}
          </p>
          <p className="truncate text-[0.7rem] uppercase tracking-[0.16em] text-white/42">
            Account
          </p>
        </div>
        <Link
          href={"/settings" as Route}
          onClick={() => setMobileNavOpen(false)}
          className="trip-glass-icon-button h-10 w-10 bg-[color:var(--control-bg)] hover:bg-[color:var(--control-bg-hover)]"
          aria-label="Open account settings"
        >
          <Settings2 className="h-4 w-4" />
        </Link>
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => void signIn("google", { redirectTo: pathname })}
      className="trip-glass-button w-full justify-center rounded-[1.35rem] bg-[color:var(--control-bg)] px-4 py-3.5 text-sm hover:bg-[color:var(--control-bg-hover)]"
    >
      <ArrowUpRight className="h-4 w-4" />
      <span>Continue with Google</span>
    </button>
  );

  return (
    <AppThemeProvider
      className={cn(
        "flex h-full min-h-0 min-w-0 overflow-hidden",
        currentUser ? "app-theme-shell" : "",
      )}
      enabled={Boolean(currentUser)}
      themePreset={currentUser ? themePreset : undefined}
      backgroundImageUrl={currentUser ? backgroundImageUrl : null}
    >
      {currentUser ? <AppShellBackground /> : null}

      {mobileNavOpen ? (
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/55 md:hidden"
          aria-label="Close sidebar"
        />
      ) : null}

      <button
        type="button"
        onClick={() => setMobileNavOpen((value) => !value)}
        className="fixed bottom-4 left-4 z-50 flex h-13 w-13 items-center justify-center rounded-full border border-white/10 bg-[#141414]/92 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl md:hidden"
        aria-label={mobileNavOpen ? "Hide sidebar" : "Show sidebar"}
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full min-h-0 w-[18rem] shrink-0 flex-col overflow-y-auto border-r border-white/8 bg-[color:transparent] transition-transform duration-300 md:static md:relative md:z-10 md:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex min-h-full flex-col p-4 lg:p-5">
          <div className="flex items-center gap-3 text-white">
            <Link href={"/" as Route} className="flex items-center gap-3">
              <span className="text-[2rem] font-semibold tracking-[-0.08em]">Gather</span>
            </Link>
          </div>

          <div className="mt-5 grid gap-2">{navLinks}</div>

          <div className="mt-auto pt-5">{authPanel}</div>
        </div>
      </aside>

      <LenisProvider className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <main className=" relative min-h-full gap-4 p-4 flex flex-col sm:p-5 lg:p-6">{children}</main>
      </LenisProvider>
    </AppThemeProvider>
  );
}
