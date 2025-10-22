import type { SupabaseClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { createServerClient, parseCookieHeader, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types.ts";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

interface SupabaseContext {
  headers: Headers;
  cookies: AstroCookies;
}

// This is the server-side client
export const createSupabaseServerClient = (context: SupabaseContext): SupabaseClient<Database> => {
  // @ts-expect-error - correct implementation per Supabase docs
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      // @ts-expect-error - correct implementation per Supabase docs
      getAll() {
        const cookieHeader = context.headers.get("Cookie") ?? "";
        return parseCookieHeader(cookieHeader);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });
};
