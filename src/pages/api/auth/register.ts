import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/db/supabase.client";
import { RegisterSchema } from "@/lib/auth/schemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.json();

  const validatedFields = RegisterSchema.safeParse(formData);

  if (!validatedFields.success) {
    return new Response(JSON.stringify({ errors: validatedFields.error.flatten().fieldErrors }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, password } = validatedFields.data;

  const supabase = createSupabaseServerClient({ cookies });

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, // Using 400 for simplicity, could be 409 for existing user
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Registered successfully" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
