"use client";

import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function AppState({
  title,
  description,
  eyebrow,
  loading = false,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-screen items-center justify-center px-4 py-10", className)}>
      <section className="w-full max-w-xl rounded-[28px] border border-white/10  p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
        {loading ? (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
            <Loader2 className="h-6 w-6 animate-spin text-white/78" />
          </div>
        ) : null}
        {eyebrow ? (
          <p className={cn("text-xs font-semibold uppercase tracking-[0.24em] text-white/42", loading && "mt-5")}>
            {eyebrow}
          </p>
        ) : null}
        <h1 className={cn("text-3xl font-semibold tracking-[-0.05em] text-white", (eyebrow || loading) && "mt-4")}>
          {title}
        </h1>
        {description ? (
          <p className="mt-4 text-sm leading-6 text-white/58">{description}</p>
        ) : null}
      </section>
    </div>
  );
}
