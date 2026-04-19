import type { Preloaded } from "convex/react";

import { api } from "@/convex/_generated/api";

export type TripPagePreloadedData = {
  currentUser: Preloaded<typeof api.users.current>;
  expenses: Preloaded<typeof api.expenses.list>;
  photos: Preloaded<typeof api.photos.list>;
  proposals: Preloaded<typeof api.proposals.listAccommodations>;
  travelers: Preloaded<typeof api.availabilities.list>;
  trip: Preloaded<typeof api.trips.get>;
};
