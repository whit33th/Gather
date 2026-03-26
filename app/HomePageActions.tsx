"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import CreateTripModal from "@/components/CreateTripModal";

export default function HomePageActions() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="editorial-button-primary px-5 py-3.5 text-[0.74rem]"
        >
          Add trip
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
