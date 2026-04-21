import { api } from "@/convex/_generated/api";
import { preloadServerQuery } from "@/lib/convex-server";

import { HomeInteractive } from "./home/HomeInteractive";

export default async function HomePage() {
  const preloadedTrips = await preloadServerQuery(api.trips.list, {});

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="sr-only">
        <h1>Gather — your trips</h1>
        <p>Plan group trips together on an interactive globe and trip cards.</p>
      </header>
      <HomeInteractive preloadedTrips={preloadedTrips} />
    </div>
  );
}
