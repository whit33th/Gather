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
        <div className="glass-panel inline-flex items-center gap-1 rounded-full p-1">
          <button
            type="button"
            onClick={() => setActive("overview")}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.72rem] font-medium transition-[background-color,color,box-shadow] ${
              active === "overview"
                ? "bg-white text-[#072432] shadow-[0_10px_24px_rgba(2,14,20,0.28)]"
                : "text-white/66 hover:text-white"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActive("chat")}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[0.72rem] font-medium transition-[background-color,color,box-shadow] ${
              active === "chat"
                ? "bg-white text-[#072432] shadow-[0_10px_24px_rgba(2,14,20,0.28)]"
                : "text-white/66 hover:text-white"
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
