"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

import type { Id } from "@/convex/_generated/dataModel";

export default function TripShareButton({ tripId }: { tripId: Id<"trips"> }) {
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
      className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-white bg-white text-sm text-black transition hover:border-white hover:bg-[#f4f1e8] hover:text-black sm:w-fit sm:px-5"
    >
      <Share2 className="h-4 w-4" />
      <span className="hidden sm:block">{copied ? "Copied" : "Share"}</span>
    </button>
  );
}
