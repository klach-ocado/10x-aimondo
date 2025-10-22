import { z } from "zod";
import { LoginSchema, PasswordResetSchema, RegisterSchema, UpdatePasswordSchema } from "@/lib/auth/schemas";

// Define result types for clear component-level handling
interface AuthResult {
  ok: boolean;
  error?: string;
}
type UpdatePasswordResult = { status: "success" } | { status: "unauthorized" } | { status: "error"; error: string };

async function post(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const authService = {
  async login(values: z.infer<typeof LoginSchema>): Promise<AuthResult> {
    const response = await post("/api/auth/login", values);
    if (response.ok) {
      return { ok: true };
    }
    const errorData = await response.json();
    return { ok: false, error: errorData.error || "An unexpected error occurred." };
  },

  async register(values: z.infer<typeof RegisterSchema>): Promise<AuthResult> {
    const response = await post("/api/auth/register", values);
    if (response.ok) {
      return { ok: true };
    }
    const errorData = await response.json();
    return { ok: false, error: errorData.error || "An unexpected error occurred." };
  },

  async requestPasswordReset(values: z.infer<typeof PasswordResetSchema>): Promise<void> {
    // Fire-and-forget for security
    await post("/api/auth/password-reset", values);
  },

  async updatePassword(values: z.infer<typeof UpdatePasswordSchema>): Promise<UpdatePasswordResult> {
    const response = await post("/api/auth/update-password", values);
    if (response.ok) {
      return { status: "success" };
    }
    if (response.status === 401) {
      return { status: "unauthorized" };
    }
    const errorData = await response.json();
    return { status: "error", error: errorData.error || "An unexpected error occurred." };
  },
};
