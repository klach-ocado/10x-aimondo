import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

const DEFAULT_LOCAL_USER_ID = "46979a74-07df-4133-b0a5-e458ea728ca9";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  context.locals.user = { id: DEFAULT_LOCAL_USER_ID };
  return next();
});
