import type { SupabaseClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// This is the server-side client
export const createSupabaseServerClient = (context: {
  cookies: AstroCookies;
}): SupabaseClient<Database> => {
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(key: string) {
          return context.cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          context.cookies.set(key, value, options);
        },
        remove(key: string, options: CookieOptions) {
          context.cookies.delete(key, options);
        },
      },
    }
  );
};
