"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import {
  budgetBuckets,
  currencyFormatter,
  getBudgetBucket,
  type ExpenseCategory,
} from "@/components/cards/shared";
import UserAvatar from "@/components/UserAvatar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { ExpenseCard } from "../types";

export default function TripBudgetDrawer({
  expenses,
  open,
  onOpenChange,
  totalBudget,
  tripId,
}: {
  expenses: ExpenseCard[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalBudget: number;
  tripId: Id<"trips">;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [editingExpenseId, setEditingExpenseId] = useState<Id<"expenses"> | null>(null);

  const addExpense = useMutation(api.expenses.add);
  const updateExpense = useMutation(api.expenses.update);
  const removeExpense = useMutation(api.expenses.remove);

  const resetComposer = () => {
    setTitle("");
    setAmount("");
    setCategory("food");
    setEditingExpenseId(null);
  };

  useEffect(() => {
    if (open) {
      resetComposer();
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title || !amount) return;

    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount)) return;

    try {
      if (editingExpenseId) {
        await updateExpense({
          expenseId: editingExpenseId,
          title,
          amount: numericAmount,
          category,
        });
      } else {
        await addExpense({ tripId, title, amount: numericAmount, category });
      }

      resetComposer();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] rounded-t-[2rem] border-white/16 bg-[rgba(8,10,12,0.58)] text-white">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-[1.35rem] leading-tight text-white">
            {editingExpenseId ? "Edit expense" : "Add expense"}
          </DrawerTitle>
          <DrawerDescription>
            Log hotel, transport, food, and other shared costs so everyone can see the running
            total.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-5 pb-6 sm:px-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-[1.6rem] border border-white/14 bg-black/16 px-4 py-4 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/56">
                Category
              </p>
              {editingExpenseId ? (
                <button
                  type="button"
                  onClick={resetComposer}
                    className="trip-glass-icon-button h-10 w-10 bg-transparent text-white/76 hover:bg-white/8 hover:text-white"
                  aria-label="Cancel editing expense"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {budgetBuckets.map((bucket) => {
                const Icon = bucket.icon;
                const selected = category === bucket.id;

                return (
                  <button
                    key={bucket.id}
                    type="button"
                    onClick={() => setCategory(bucket.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] transition ${
                      selected
                        ? "border-white/30 bg-white/12 text-white"
                        : "border-white/16 bg-transparent text-white/70 hover:border-white/24 hover:text-white"
                    }`}
                    aria-pressed={selected}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {bucket.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs leading-5 text-white/46">
              Use <span className="font-semibold text-white/70">Stay</span> for hotel, Airbnb, or
              apartment costs.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Hotel split"
                className="w-full rounded-2xl border border-white/18 bg-transparent px-4 py-3.5 text-white placeholder:text-white/45 transition-[border-color,background-color] focus:border-white/30 focus:bg-white/6 focus:outline-none"
              />
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Amount"
                type="number"
                className="w-full rounded-2xl border border-white/18 bg-transparent px-4 py-3.5 text-white placeholder:text-white/45 transition-[border-color,background-color] focus:border-white/30 focus:bg-white/6 focus:outline-none"
              />
            </div>

              <button
                type="submit"
                className="editorial-button-primary mt-4 w-full justify-center px-4 py-3.5 text-[0.62rem]"
              >
                <Plus className="h-4 w-4" />
                {editingExpenseId ? "Save expense" : "Add expense"}
              </button>
            </form>

          <div className="mt-4 space-y-3 pb-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/56">Records</p>
              <p className="text-xs uppercase tracking-[0.14em] text-white/56">
                {currencyFormatter.format(totalBudget)} · {expenses.length}
              </p>
            </div>
            {expenses.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-white/22 bg-black/16 px-4 py-6 text-sm text-white/62 backdrop-blur-xl">
                No expenses yet. Start with your stay, transport, or first shared meal.
              </div>
            ) : (
              expenses.map((expense) => (
                <article
                  key={expense._id}
                  className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-white/14 bg-black/16 px-4 py-3.5 backdrop-blur-xl"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{expense.title}</p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <UserAvatar
                        name={expense.payerName}
                        image={expense.payerImage}
                        seed={expense.payerUserId || expense.payerName}
                        size={28}
                      />
                      <p className="truncate text-xs uppercase tracking-[0.14em] text-white/58">
                        {expense.payerName}
                      </p>
                      <span className="truncate rounded-full border border-white/18 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-white/70">
                        {budgetBuckets.find((bucket) => bucket.id === (expense.category ?? getBudgetBucket(expense.title)))?.label ??
                          "Entertainment"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpenseId(expense._id as Id<"expenses">);
                        setTitle(expense.title);
                        setAmount(String(expense.amount));
                        setCategory(expense.category ?? getBudgetBucket(expense.title));
                      }}
                      className="trip-glass-icon-button h-10 w-10 bg-transparent text-white/76 hover:bg-white/8 hover:text-white"
                      aria-label={`Edit ${expense.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-white">
                      {currencyFormatter.format(expense.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void removeExpense({ expenseId: expense._id as Id<"expenses"> })}
                      className="trip-glass-icon-button h-10 w-10 bg-transparent text-white/76 hover:bg-white/8 hover:text-[#f3b4a3]"
                      aria-label={`Delete ${expense.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
