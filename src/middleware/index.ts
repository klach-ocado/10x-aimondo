import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "@/db/supabase.client";

const protectedRoutes = ["/dashboard", "/heatmap", "/workouts"];
const authRoutes = ["/auth/login", "/auth/register"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClient(context);

  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    context.locals.user = { id: session.user.id, email: session.user.email };
  } else {
    context.locals.user = null;
  }

  const currentRoute = context.url.pathname;

  if (context.locals.user && authRoutes.some(path => currentRoute.startsWith(path))) {
    return context.redirect("/dashboard");
  }

  if (!context.locals.user && protectedRoutes.some(path => currentRoute.startsWith(path))) {
    return context.redirect("/auth/login");
  }

  return next();
});