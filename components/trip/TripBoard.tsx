"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  defaultDropAnimationSideEffects,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { motion } from "motion/react";
import { GripVertical, X } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";

type DashboardCardKind =
  | "hero"
  | "arrival"
  | "stay"
  | "weather"
  | "map"
  | "travelers"
  | "tripNotes"
  | "budgetSummary"
  | "spots"
  | "packingSummary"
  | "budget"
  | "packing"
  | "gallery"
  | "proposals"
  | "availability"
  | "chat"
  | "note";

type DashboardCardRecord = {
  _id: Id<"dashboardCards">;
  tripId: Id<"trips">;
  kind: DashboardCardKind;
  title?: string;
  content?: string;
  order: number;
};

type ActiveCardRect = {
  width: number;
  height: number;
};

const dropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.35",
      },
    },
  }),
};

const kindLabel: Record<DashboardCardKind, string> = {
  hero: "Hero",
  arrival: "Arrival",
  stay: "Stay",
  weather: "Weather",
  map: "Map",
  travelers: "Travelers",
  tripNotes: "Trip Notes",
  budgetSummary: "Budget Summary",
  spots: "Spots",
  packingSummary: "Packing Summary",
  budget: "Budget",
  packing: "Packing",
  gallery: "Gallery",
  proposals: "Proposals",
  availability: "Availability",
  chat: "Chat",
  note: "Note",
};

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  return closestCorners(args);
};

function SortableBoardCard({
  card,
  isDropTarget,
  className,
  children,
  onRemove,
}: {
  card: DashboardCardRecord;
  isDropTarget: boolean;
  className: string;
  children: ReactNode;
  onRemove: (cardId: Id<"dashboardCards">) => void | Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card._id,
  });

  const style = {
    // transform: CSS.Transform.toString(transform),
    // transition: transition || "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <motion.div
      ref={setNodeRef}
      layout
      style={style}
      data-dashboard-card={card.kind}
      data-dashboard-card-id={card._id}
      className={cn(
        "group relative min-w-0 will-change-transform",
        className,
        isDragging && "z-40 cursor-grabbing opacity-40"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-20 rounded-[32px] opacity-0 transition-all duration-200",
          isDropTarget &&
          !isDragging &&
          "bg-[#dbe887]/10 opacity-100 shadow-[inset_0_0_0_2px_rgba(219,232,135,0.6)]"
        )}
      />

      <button
        type="button"
        aria-label={`Drag ${kindLabel[card.kind]} card`}
        className="absolute left-4 top-4 z-30 flex h-9 w-9 cursor-grab touch-none items-center justify-center rounded-full border border-[#2b4035] bg-[#14251e]/92 text-[#cfd8cd] opacity-0 backdrop-blur-xl transition hover:border-[#465b50] hover:text-white group-hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => void onRemove(card._id)}
        className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-[#2b4035] bg-[#14251e]/92 text-[#cfd8cd] opacity-0 backdrop-blur-xl transition hover:border-[#d48d7a] hover:text-[#f3b4a3] group-hover:opacity-100"
        aria-label="Remove card"
      >
        <X className="h-4 w-4" />
      </button>

      {children}
    </motion.div>
  );
}

export default function TripBoard({
  cards,
  getSpan,
  renderCard,
  onRemove,
  onReorder,
}: {
  cards: DashboardCardRecord[] | undefined;
  getSpan: (kind: DashboardCardKind) => string;
  renderCard: (card: DashboardCardRecord) => ReactNode;
  onRemove: (cardId: Id<"dashboardCards">) => void | Promise<void>;
  onReorder: (cardIds: Id<"dashboardCards">[]) => Promise<void>;
}) {
  const [orderedCards, setOrderedCards] = useState<DashboardCardRecord[]>([]);
  const [activeCardId, setActiveCardId] = useState<Id<"dashboardCards"> | null>(null);
  const [overCardId, setOverCardId] = useState<Id<"dashboardCards"> | null>(null);
  const [activeCardRect, setActiveCardRect] = useState<ActiveCardRect | null>(null);

  useEffect(() => {
    setOrderedCards(cards || []);
  }, [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const cardIds = useMemo(() => orderedCards.map((card) => card._id), [orderedCards]);
  const activeCard = orderedCards.find((card) => card._id === activeCardId) || null;
  const activeCardContent = activeCard ? renderCard(activeCard) : null;
  const activeOverlayStyle = activeCardRect
    ? {
        width: activeCardRect.width,
        height: activeCardRect.height,
        maxWidth: "calc(100vw - 2rem)",
      }
    : undefined;

  const handleDragStart = (event: DragStartEvent) => {
    const nextActiveCardId = event.active.id as Id<"dashboardCards">;
    const activeElement = document.querySelector<HTMLElement>(
      `[data-dashboard-card-id="${nextActiveCardId}"]`
    );
    const rect = activeElement?.getBoundingClientRect();

    setActiveCardId(nextActiveCardId);
    setOverCardId(nextActiveCardId);
    setActiveCardRect(
      rect
        ? {
          width: Math.min(rect.width, window.innerWidth - 32),
          height: rect.height,
        }
        : null
    );
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverCardId((event.over?.id as Id<"dashboardCards"> | undefined) || null);
  };

  const resetDragState = () => {
    setActiveCardId(null);
    setOverCardId(null);
    setActiveCardRect(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      resetDragState();
      return;
    }

    const previousCards = orderedCards;
    const oldIndex = previousCards.findIndex((card) => card._id === active.id);
    const newIndex = previousCards.findIndex((card) => card._id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      resetDragState();
      return;
    }

    const nextCards = arrayMove(previousCards, oldIndex, newIndex);
    setOrderedCards(nextCards);
    resetDragState();

    void onReorder(nextCards.map((card) => card._id)).catch((error) => {
      console.error(error);
      setOrderedCards(previousCards);
    });
  };

  if (cards === undefined) {
    return <div className="rounded-[30px] border border-[#23362d] bg-[#10211b] p-8 text-center text-[#9fb0a3]">Loading board...</div>;
  }

  if (orderedCards.length === 0) {
    return <div className="rounded-[30px] border border-dashed border-[#31463c] bg-[#10211b] p-8 text-center text-[#9fb0a3]">No cards on the board yet.</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={resetDragState}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={cardIds} strategy={rectSortingStrategy}>
        <div className="min-w-0 overflow-x-hidden grid min-w-0 gap-4 lg:grid-cols-12">
          {orderedCards.map((card) => (
            <SortableBoardCard
              key={card._id}
              card={card}
              onRemove={onRemove}
              isDropTarget={Boolean(activeCardId) && overCardId === card._id}
              className={getSpan(card.kind)}
            >
              {renderCard(card)}
            </SortableBoardCard>
          ))}
        </div>
      </SortableContext>

      <DragOverlay adjustScale={false} dropAnimation={dropAnimation}>
        {activeCardContent ? (
          <div
            style={activeOverlayStyle}
            className="pointer-events-none min-w-0 overflow-hidden shadow-[0_28px_70px_rgba(0,0,0,0.22)]"
          >
            {activeCardContent}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
