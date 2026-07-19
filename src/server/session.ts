import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/server/auth";

/**
 * Returns the current session, deduplicated per request via React cache.
 * Safe to call in multiple server components on the same page — only one
 * DB round-trip is made.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
