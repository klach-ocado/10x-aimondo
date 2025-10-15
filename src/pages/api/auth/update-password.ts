import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/db/supabase.client";
import { UpdatePasswordSchema } from "@/lib/auth/schemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.json();

  const validatedFields = UpdatePasswordSchema.safeParse(formData);

  if (!validatedFields.success) {
    return new Response(JSON.stringify({ errors: validatedFields.error.flatten().fieldErrors }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { password } = validatedFields.data;
  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  // The user's session is automatically handled by the ssr library
  // using the recovery token from the cookie.
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    const isTokenError = /token/i.test(error.message) || /expired/i.test(error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: isTokenError ? 401 : 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Password updated successfully" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
