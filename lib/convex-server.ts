import "server-only";

import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import type { Preloaded } from "convex/react";
import type {
  FunctionArgs,
  FunctionReference,
} from "convex/server";
import { cache } from "react";

export const getServerConvexToken = cache(async () => {
  return convexAuthNextjsToken();
});

export const getServerQueryOptions = cache(async () => {
  const token = await getServerConvexToken();
  return token ? { token } : {};
});

export async function preloadServerQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>,
): Promise<Preloaded<Query>> {
  return preloadQuery(query, args, await getServerQueryOptions());
}
