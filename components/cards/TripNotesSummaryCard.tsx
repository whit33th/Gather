import { FileText } from "lucide-react";

import type { DashboardCardRecord } from "@/components/trip/types";

import { cardSurface, SummaryActionButton, SummaryEyebrow } from "./shared";

export function TripNotesSummaryCard({
  card,
  extraNotesCount,
  onEdit,
}: {
  card?: DashboardCardRecord | null;
  extraNotesCount?: number;
  onEdit: () => void;
}) {
  return (
    <section className={cardSurface("flex flex-col p-6")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className=" truncate text-[1.65rem] font-semibold tracking-[-0.05em] sm:text-[1.85rem]">
            {card?.title || "Shared notes"}
          </h2>
        </div>
        <SummaryActionButton label="Edit trip notes" onClick={onEdit} />
      </div>

      <p className="mt-5 line-clamp-4 whitespace-pre-wrap text-[1rem] leading-7 text-[color:var(--trip-card-muted-text)]">
        {card?.content ||
          "Use one shared note for itinerary anchors, meeting point, booking references, and reminders everyone needs."}
      </p>

      <div className="mt-auto pt-5">
        <div className="trip-theme-chip inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em]">
          <FileText className="h-3.5 w-3.5" />
          <span>{extraNotesCount || 0} extra note{extraNotesCount === 1 ? "" : "s"}</span>
        </div>
      </div>
    </section>
  );
}
