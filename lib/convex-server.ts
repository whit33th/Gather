import "server-only";

import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { cache } from "react";

export const getServerConvexToken = cache(async () => {
  return convexAuthNextjsToken();
});

export async function fetchServerQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>,
): Promise<FunctionReturnType<Query>> {
  const token = await getServerConvexToken();

  return fetchQuery(query, args, token ? { token } : {});
}
