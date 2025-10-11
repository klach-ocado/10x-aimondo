import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

const DEFAULT_LOCAL_USER_ID = "9a6b978e-fa10-46c3-8160-04087c270a03";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  context.locals.user = { id: DEFAULT_LOCAL_USER_ID };
  return next();
});
