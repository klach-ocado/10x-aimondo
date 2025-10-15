import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "@/db/supabase.client";

// These routes are publicly accessible and do not require authentication.
const publicRoutes = ["/", "/auth", "/api/auth"];

// These routes are for authentication and should not be accessible to logged-in users.
const authRoutes = ["/auth/login", "/auth/register"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClient({ cookies: context.cookies, headers: context.request.headers });
  context.locals.supabase = supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  context.locals.user = user ? { id: user.id, email: user.email } : null;

  const currentRoute = context.url.pathname;

  // If the user is logged in, redirect them from auth pages to the dashboard.
  if (user && authRoutes.some((path) => currentRoute.startsWith(path))) {
    return context.redirect("/dashboard", 302);
  }

  const isPublic = publicRoutes.some((path) => (path === "/" ? currentRoute === "/" : currentRoute.startsWith(path)));

  // If the user is not logged in and the route is not public, block access.
  if (!user && !isPublic) {
    // For API routes, return a 401 Unauthorized response.
    if (currentRoute.startsWith("/api")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    // For pages, redirect to the login page.
    return context.redirect("/auth/login", 302);
  }

  return next();
});
