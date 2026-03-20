"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Compass,
  LayoutGrid,
  List,
  Plus,
  Search,
  Settings2,
  Share2,
  UsersRound,
} from "lucide-react";

type DashboardView = "board" | "search" | "people" | "calendar" | "list";

type SavedPlan = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
};

const navItems: Array<{
  id: DashboardView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "search", label: "Search", icon: Search },
  { id: "people", label: "People", icon: UsersRound },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "list", label: "Lists", icon: List },
];

export default function Navigation({
  tripId,
  title,
  destination,
  heroImage,
  currentViewerRole,
  travelerCount,
  activeView,
  savedPlans,
  savedPlansOpen,
  mobileNavOpen,
  copied,
  onToggleMobileNav,
  onSelectView,
  onShare,
  onToggleSavedPlans,
  onOpenAddCard,
}: {
  tripId: string;
  title: string;
  destination: string;
  heroImage?: string;
  currentViewerRole?: "owner" | "member";
  travelerCount: number;
  activeView: DashboardView;
  savedPlans: SavedPlan[];
  savedPlansOpen: boolean;
  mobileNavOpen: boolean;
  copied: boolean;
  onToggleMobileNav: () => void;
  onSelectView: (view: DashboardView) => void;
  onShare: () => void;
  onToggleSavedPlans: () => void;
  onOpenAddCard: () => void;
}) {
  const savedPlansSection = (
    <section className="mt-6">
      <button
        type="button"
        onClick={onToggleSavedPlans}
        className="flex w-full items-center justify-between px-1 py-2 text-left"
      >
        <span className="text-sm font-medium text-white/74">Saved plans</span>
        {savedPlansOpen ? (
          <ChevronUp className="h-4 w-4 text-white/46" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/46" />
        )}
      </button>

      {savedPlansOpen ? (
        <ul className="mt-3 space-y-3">
          {savedPlans.map((plan) => (
            <li key={plan.id}>
              <button
                type="button"
                onClick={() => onSelectView("board")}
                className="w-full overflow-hidden rounded-[22px] border border-white/10 bg-[#171717] text-left transition hover:border-white/16 hover:bg-[#1a1a1a]"
              >
                <div
                  className="h-28 bg-cover bg-center"
                  style={{ backgroundImage: `url("${plan.image}")` }}
                />
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-medium tracking-[-0.04em]">{plan.title}</p>
                    <p className="mt-1 truncate text-sm text-white/46">{plan.subtitle}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.68rem] text-white/50">
                    View
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );

  const navButtons = navItems.map((item) => {
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectView(item.id)}
        className={`trip-glass-button w-full justify-start px-4 py-3 text-sm tracking-[-0.02em] ${
          activeView === item.id
            ? "border-white/24 bg-white/[0.14] text-white"
            : "text-white/72 hover:text-white"
        }`}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </button>
    );
  });

  return (
    <>
      <header className="border-b border-white/8 bg-[#0b0b0b] px-4 py-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onToggleMobileNav}
              className="trip-glass-icon-button shrink-0"
              aria-label="Toggle trip navigation"
            >
              <List className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-[-0.05em]">{title}</p>
              <p className="truncate text-sm text-white/48">{destination}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectView("search")}
              className="trip-glass-icon-button"
              aria-label="Open search view"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onShare}
              className="trip-glass-icon-button"
              aria-label="Share trip"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {mobileNavOpen ? (
          <div className="mt-4 grid gap-2 pb-1">
            {navButtons}
            <div className={`mt-2 grid gap-2 ${currentViewerRole === "owner" ? "grid-cols-3" : "grid-cols-2"}`}>
              <button type="button" onClick={onOpenAddCard} className="trip-glass-button justify-center px-4 py-3">
                <Plus className="h-4 w-4" />
                <span>Add Card</span>
              </button>
              <button type="button" onClick={onShare} className="trip-glass-button justify-center px-4 py-3">
                <Share2 className="h-4 w-4" />
                <span>{copied ? "Copied" : "Share"}</span>
              </button>
              {currentViewerRole === "owner" ? (
                <Link
                  href={`/trip/${tripId}/settings` as Route}
                  className="trip-glass-button justify-center px-4 py-3"
                >
                  <Settings2 className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              ) : null}
            </div>
            {savedPlansSection}
          </div>
        ) : null}
      </header>

      <aside className="hidden w-[19rem] shrink-0 border-r border-white/8 bg-[#0b0b0b] md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:overflow-y-auto">
        <div className="p-4 lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#181818]">
                <Compass className="h-4 w-4" />
              </span>
              <span className="text-[2rem] font-semibold tracking-[-0.08em]">Edge</span>
            </Link>

            {currentViewerRole === "owner" ? (
              <Link
                href={`/trip/${tripId}/settings` as Route}
                className="trip-glass-icon-button"
                aria-label="Trip settings"
              >
                <Settings2 className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          <section className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-[#171717]">
            <div
              className="h-24 bg-cover bg-center"
              style={heroImage ? { backgroundImage: `url("${heroImage}")` } : undefined}
            />
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#ff5a21] text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white">
                Trip
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-medium tracking-[-0.04em]">{title}</p>
                <p className="text-sm text-white/50">
                  {Math.max(travelerCount, 1)} member{travelerCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-2">{navButtons}</div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={onOpenAddCard} className="trip-glass-button justify-center px-4 py-3">
              <Plus className="h-4 w-4" />
              <span>Add Card</span>
            </button>
            <button type="button" onClick={onShare} className="trip-glass-button justify-center px-4 py-3">
              <Share2 className="h-4 w-4" />
              <span>{copied ? "Copied" : "Share"}</span>
            </button>
          </div>

          {savedPlansSection}
        </div>
      </aside>
    </>
  );
}
