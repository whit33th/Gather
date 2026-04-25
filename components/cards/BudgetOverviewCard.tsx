import type { ExpenseCard } from "@/components/trip/types";

import {
  budgetBuckets,
  cardSurface,
  currencyFormatter,
  getBudgetBucket,
} from "./shared";

export function BudgetOverviewCard({
  expenses,
  totalBudget,
  expenseCount,
  budgetTarget,
  onOpen,
}: {
  expenses: ExpenseCard[] | undefined;
  totalBudget: number;
  expenseCount: number;
  budgetTarget: number;
  onOpen: () => void;
}) {
  const totals = new Map<string, number>(
    budgetBuckets.map((bucket) => [bucket.id, 0]),
  );

  (expenses || []).forEach((expense) => {
    const bucketId = getBudgetBucket(expense.title, expense.category);
    totals.set(bucketId, (totals.get(bucketId) || 0) + expense.amount);
  });

  const safeTotal = totalBudget || 1;
  const bucketSummary = budgetBuckets.map((bucket) => {
    const amount = totals.get(bucket.id) || 0;
    const percent =
      totalBudget > 0 ? Math.round((amount / safeTotal) * 100) : 0;

    return {
      ...bucket,
      amount,
      percent,
    };
  });

  return (
    <section
      className={cardSurface(
        "grid grid-cols-2 gap-3 p-4 xl:grid-cols-[11rem_minmax(0,1fr)]",
      )}
    >
      <div className="trip-theme-subsurface flex flex-col items-center justify-center rounded-3xl px-4 py-5 text-center">
        <p className="section-kicker text-[0.56rem]">Expenses</p>
        <p className="mt-3 text-[2.35rem] font-semibold tracking-[-0.08em] text-white">
          {currencyFormatter.format(totalBudget)}
        </p>

        <button
          type="button"
          onClick={onOpen}
          className="editorial-button-secondary mt-6 justify-center px-4 py-3 text-[0.62rem]"
        >
          Add or edit costs
        </button>
      </div>

      <div className="trip-theme-subsurface rounded-3xl px-4 py-4">
        <div className="space-y-2.5">
          {bucketSummary.map((bucket) => {
            const Icon = bucket.icon;
            const width =
              totalBudget > 0
                ? Math.max(bucket.percent, bucket.amount > 0 ? 10 : 0)
                : 0;

            return (
              <div key={bucket.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[color:var(--trip-card-muted-text)]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate text-[#e9eee5]">
                      {bucket.label}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-medium text-white">
                      {currencyFormatter.format(bucket.amount)}
                    </span>
                    <span className="ml-1 text-[color:var(--trip-card-muted-text)]">
                      ({bucket.percent}%)
                    </span>
                  </div>
                </div>
                <div className="trip-theme-track mt-2 h-1.5 rounded-full">
                  <div
                    className={`h-full rounded-full ${bucket.barClass}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="trip-theme-divider mt-4 flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-[color:var(--trip-card-muted-text)]">
            Target
          </span>
          <div className="text-right">
            <span className="font-medium text-white">
              {currencyFormatter.format(budgetTarget)}
            </span>
            <span className="ml-2 text-[color:var(--trip-card-muted-text)]">
              / {expenseCount} records
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
