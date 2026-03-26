import { api } from "@/convex/_generated/api";
import { fetchServerQuery } from "@/lib/convex-server";

import SettingsPageClient from "./SettingsPageClient";

export default async function SettingsPage() {
  const currentUser = await fetchServerQuery(api.users.current, {});

  return <SettingsPageClient currentUser={currentUser} />;
}
