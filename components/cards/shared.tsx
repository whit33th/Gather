import Link from "next/link";
import {
  Hotel,
  MoreHorizontal,
  Plane,
  Plus,
  Ticket,
  UtensilsCrossed,
} from "lucide-react";

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const expenseCategories = [
  "flights",
  "stay",
  "food",
  "drinks",
  "entertainment",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export const budgetBuckets = [
  {
    id: "flights",
    label: "Flights",
    icon: Plane,
    keywords: ["flight", "plane", "air", "airport", "train", "rail", "bus", "transport"],
    barClass: "bg-[linear-gradient(90deg,#dbe887,#b7d56a)]",
  },
  {
    id: "stay",
    label: "Stay",
    icon: Hotel,
    keywords: [
      "hotel",
      "resort",
      "villa",
      "stay",
      "room",
      "hostel",
      "booking",
      "airbnb",
      "apartment",
      "accommodation",
    ],
    barClass: "bg-[linear-gradient(90deg,#8fd0c0,#5ab8a3)]",
  },
  {
    id: "food",
    label: "Food",
    icon: UtensilsCrossed,
    keywords: [
      "food",
      "dinner",
      "lunch",
      "breakfast",
      "restaurant",
      "cafe",
      "brunch",
      "meal",
    ],
    barClass: "bg-[linear-gradient(90deg,#c7b0ff,#9d84ec)]",
  },
  {
    id: "drinks",
    label: "Drinks",
    icon: UtensilsCrossed,
    keywords: ["drink", "bar", "coffee", "cocktail", "juice", "tea", "wine", "beer"],
    barClass: "bg-[linear-gradient(90deg,#8fc8ff,#6ea7ff)]",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: Ticket,
    keywords: [],
    barClass: "bg-[linear-gradient(90deg,#f2c98b,#e0a765)]",
  },
] as const satisfies ReadonlyArray<{
  id: ExpenseCategory;
  label: string;
  icon: typeof Plane;
  keywords: readonly string[];
  barClass: string;
}>;

export function getBudgetBucket(title: string, explicitCategory?: ExpenseCategory) {
  if (explicitCategory && expenseCategories.includes(explicitCategory)) {
    return explicitCategory;
  }

  const normalized = title.toLowerCase();

  return (
    budgetBuckets.find(
      (bucket) =>
        bucket.id !== "entertainment" &&
        bucket.keywords.some((keyword) => normalized.includes(keyword)),
    )?.id ?? "entertainment"
  );
}

export function cardSurface(extra = "") {
  return `trip-theme-card trip-dashboard-surface h-full rounded-4xl ${extra}`;
}

export function SummaryActionButton({
  label,
  href,
  onClick,
  variant = "more",
  contrast = "dark",
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "more" | "plus";
  contrast?: "dark" | "light";
}) {
  const Icon = variant === "plus" ? Plus : MoreHorizontal;
  const className =
    contrast === "light"
      ? "summary-action-button summary-action-button-light trip-theme-chip flex h-10 w-10 items-center justify-center rounded-full bg-white/36 text-[#0f5d50] transition-[background-color,border-color,color] hover:bg-white/54 sm:h-11 sm:w-11"
      : "summary-action-button trip-theme-chip flex h-10 w-10 items-center justify-center rounded-full transition-[background-color,border-color,color] hover:text-white sm:h-11 sm:w-11";

  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        <Icon className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-label={label}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function SummaryEyebrow({ children }: { children: string }) {
  return <p className="font-semibold text-[color:var(--trip-card-muted-text)]">{children}</p>;
}

export function SummaryEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="trip-theme-subsurface-solid trip-dashboard-subsurface h-full rounded-[22px] border border-dashed px-4 py-4 sm:rounded-3xl sm:py-5">
      <p className="text-sm font-medium text-[#f7f4ea]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--trip-card-muted-text)]">
        {description}
      </p>
    </div>
  );
}
