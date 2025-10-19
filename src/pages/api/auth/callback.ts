import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const { url, locals } = context;
  const authCode = url.searchParams.get("code");

  if (authCode) {
    await locals.supabase.auth.exchangeCodeForSession(authCode);
  }

  return context.redirect("/auth/update-password");
};
