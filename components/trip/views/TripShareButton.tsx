"use client";

import { useState } from "react";
import { Check, UserPlus } from "lucide-react";

import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export default function TripShareButton({
  tripId,
  label = "Invite friends",
  copiedLabel = "Invite link copied",
  variant = "primary",
  className,
}: {
  tripId: Id<"trips">;
  label?: string;
  copiedLabel?: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${tripId}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
        variant === "primary"
          ? "border border-white bg-white text-black hover:border-white hover:bg-[#f4f1e8]"
          : "border border-white/12 bg-white/[0.06] text-white hover:border-white/20 hover:bg-white/[0.1]",
        className,
      )}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
