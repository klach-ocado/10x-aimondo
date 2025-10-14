import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "@/db/supabase.client";

const protectedRoutes = ["/dashboard", "/heatmap", "/workouts"];
const authRoutes = ["/auth/login", "/auth/register"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerClient(context);
  context.locals.supabase = supabase;

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    context.locals.user = { id: user.id, email: user.email };
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