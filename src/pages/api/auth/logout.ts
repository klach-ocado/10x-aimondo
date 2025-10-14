import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);
  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  // After signing out, redirect to the login page.
  return context.redirect("/auth/login");
};
