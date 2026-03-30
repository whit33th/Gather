import { api } from "@/convex/_generated/api";
import { preloadServerQuery } from "@/lib/convex-server";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const preloadedTrips = await preloadServerQuery(api.trips.list, {});

  return <HomeClient preloadedTrips={preloadedTrips} />;
}
