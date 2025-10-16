import type { APIRoute } from "astro";

export const prerender = false;

export const DELETE: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { error } = await supabase.from("workouts").delete().eq("user_id", user!.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(null, { status: 204 });
};
