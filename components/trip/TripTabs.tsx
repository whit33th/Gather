"use client";

import { useState } from "react";
import { LayoutGrid, MessageCircle } from "lucide-react";
import { Doc, Id } from "../../convex/_generated/dataModel";
import TripOverview from "./TripOverview";
import TripChatTab from "./TripChatTab";

export default function TripTabs({
  trip,
  tripId,
}: {
  trip: Doc<"trips">;
  tripId: Id<"trips">;
}) {
  const [active, setActive] = useState<"overview" | "chat">("overview");

  return (
    <div className="space-y-6">
      <div className="flex justify-start">
        <div className="inline-flex items-center gap-1 rounded-full bg-[#eff0ef] p-1">
          <button
            type="button"
            onClick={() => setActive("overview")}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.72rem] font-medium transition-all ${
              active === "overview"
                ? "bg-white text-stone-950 shadow-[0_3px_10px_rgba(15,15,15,0.06)]"
                : "text-stone-500 hover:text-stone-950"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActive("chat")}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.72rem] font-medium transition-all ${
              active === "chat"
                ? "bg-white text-stone-950 shadow-[0_3px_10px_rgba(15,15,15,0.06)]"
                : "text-stone-500 hover:text-stone-950"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </button>
        </div>
      </div>

      {active === "overview" ? (
        <TripOverview trip={trip} tripId={tripId} />
      ) : (
        <TripChatTab tripId={tripId} />
      )}
    </div>
  );
}
