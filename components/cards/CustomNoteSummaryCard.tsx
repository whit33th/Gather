import { FileText } from "lucide-react";

import type { DashboardCardRecord } from "@/components/trip/types";

import { cardSurface, SummaryActionButton, SummaryEyebrow } from "./shared";

export function CustomNoteSummaryCard({
  card,
  noteCount,
  onCreate,
  onEdit,
}: {
  card?: DashboardCardRecord | null;
  noteCount: number;
  onCreate: () => void;
  onEdit: () => void;
}) {
  const hasNote = Boolean(card);

  return (
    <section className={cardSurface("p-6")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SummaryEyebrow>{hasNote ? "Saved Note" : "Add Note"}</SummaryEyebrow>
          <h2 className="mt-3 truncate text-[1.85rem] font-semibold tracking-[-0.05em]">
            {card?.title || "Capture an extra note"}
          </h2>
        </div>
        <SummaryActionButton
          label={hasNote ? "Edit note" : "Create note"}
          onClick={hasNote ? onEdit : onCreate}
          variant={hasNote ? "more" : "plus"}
        />
      </div>

      {hasNote ? (
        <>
          <p className="mt-5 whitespace-pre-wrap text-[1rem] leading-7 text-[color:var(--trip-card-muted-text)]">
            {card?.content}
          </p>
          <div className="trip-theme-chip mt-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em]">
            <FileText className="h-3.5 w-3.5" />
            <span>{noteCount} saved note{noteCount === 1 ? "" : "s"}</span>
          </div>
        </>
      ) : (
        <div className="trip-theme-subsurface-solid mt-5 rounded-3xl border border-dashed px-4 py-5">
          <p className="text-sm font-medium text-[#f7f4ea]">No quick note yet</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--trip-card-muted-text)]">
            Add transport details, booking references, emergency contacts, or any small
            detail that should stay visible from the main trip page.
          </p>
        </div>
      )}
    </section>
  );
}
