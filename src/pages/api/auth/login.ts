import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/db/supabase.client";
import { LoginSchema } from "@/lib/auth/schemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.json();

  const validatedFields = LoginSchema.safeParse(formData);

  if (!validatedFields.success) {
    return new Response(
      JSON.stringify({ errors: validatedFields.error.flatten().fieldErrors }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { email, password } = validatedFields.data;

  const supabase = createSupabaseServerClient({ cookies });

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: "Invalid login credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Logged in successfully" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
