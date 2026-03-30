import { api } from "@/convex/_generated/api";
import { preloadServerQuery } from "@/lib/convex-server";

import SettingsPageClient from "./SettingsPageClient";

export default async function SettingsPage() {
  const preloadedCurrentUser = await preloadServerQuery(api.users.current, {});

  return <SettingsPageClient preloadedCurrentUser={preloadedCurrentUser} />;
}
