import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/db/supabase.client";
import { PasswordResetSchema } from "@/lib/auth/schemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const formData = await request.json();

  const validatedFields = PasswordResetSchema.safeParse(formData);

  if (!validatedFields.success) {
    // Still return 200 OK even with bad input to prevent email enumeration
    return new Response(null, { status: 200 });
  }

  const { email } = validatedFields.data;
  const supabase = createSupabaseServerClient({ cookies });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${url.origin}/auth/update-password`,
  });

  if (error) {
    // Log the error for debugging but do not expose it to the client
    // For example, you could use a proper logging service here
    console.error("Password Reset Error:", error.message);
  }

  // Always return a success response to prevent user enumeration
  return new Response(null, { status: 200 });
};
