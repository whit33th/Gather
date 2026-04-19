"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { currencyFormatter } from "@/components/cards/shared";
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
  const [editingExpenseId, setEditingExpenseId] = useState<Id<"expenses"> | null>(null);

  const addExpense = useMutation(api.expenses.add);
  const updateExpense = useMutation(api.expenses.update);
  const removeExpense = useMutation(api.expenses.remove);

  const resetComposer = () => {
    setTitle("");
    setAmount("");
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
        await updateExpense({ expenseId: editingExpenseId, title, amount: numericAmount });
      } else {
        await addExpense({ tripId, title, amount: numericAmount });
      }

      resetComposer();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] rounded-t-[2rem] border-[#23372e] bg-[#0f1915] text-white">
        <DrawerHeader>
          <p className="section-kicker">Budget</p>
          <DrawerTitle className="text-white">Money snapshot</DrawerTitle>
          <DrawerDescription className="text-[#9fb0a3]">
            Add, edit, and review shared trip costs without keeping a full budget card on the board.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-5 pb-6 sm:px-6">
          <div className="rounded-[1.6rem] border border-[#23372e] bg-[#13231d] px-4 py-4">
            <p className="section-kicker text-[0.56rem]">Total</p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <p className="editorial-metric text-[clamp(2rem,5vw,3.25rem)] text-white">
                {currencyFormatter.format(totalBudget)}
              </p>
              <p className="text-sm text-[#9fb0a3]">
                {expenses.length} record{expenses.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-4 rounded-[1.6rem] border border-[#23372e] bg-[#13231d] px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">{editingExpenseId ? "Edit expense" : "Add expense"}</p>
                <p className="mt-2 text-sm text-[#9fb0a3]">
                  Keep the running cost list in the drawer and the board focused on the summary.
                </p>
              </div>
              {editingExpenseId ? (
                <button
                  type="button"
                  onClick={resetComposer}
                  className="trip-glass-icon-button h-10 w-10 bg-[color:var(--control-bg)] text-[#cfd8cd] hover:bg-[color:var(--control-bg-hover)] hover:text-white"
                  aria-label="Cancel editing expense"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Dinner reservation"
                className="editorial-input"
              />
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Amount"
                type="number"
                className="editorial-input"
              />
              <button
                type="submit"
                className="editorial-button-primary justify-center px-4 py-3 text-[0.62rem]"
              >
                <Plus className="h-4 w-4" />
                {editingExpenseId ? "Save" : "Add"}
              </button>
            </div>
          </form>

          <div className="mt-4 space-y-3 pb-2">
            {expenses.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-[#31463c] bg-[#13231d] px-4 py-6 text-sm text-[#9fb0a3]">
                No expenses yet.
              </div>
            ) : (
              expenses.map((expense) => (
                <article
                  key={expense._id}
                  className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-[#23372e] bg-[#13231d] px-4 py-3.5"
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
                      <p className="truncate text-xs uppercase tracking-[0.14em] text-[#9fb0a3]">
                        {expense.payerName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpenseId(expense._id as Id<"expenses">);
                        setTitle(expense.title);
                        setAmount(String(expense.amount));
                      }}
                      className="trip-glass-icon-button h-10 w-10 bg-[color:var(--control-bg)] text-[#cfd8cd] hover:bg-[color:var(--control-bg-hover)] hover:text-white"
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
                      className="trip-glass-icon-button h-10 w-10 bg-[color:var(--control-bg)] text-[#cfd8cd] hover:bg-[color:var(--control-bg-hover)] hover:text-[#f3b4a3]"
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
