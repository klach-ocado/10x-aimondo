import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { authService } from "./auth.service";

global.fetch = vi.fn();

describe("authService", () => {
  beforeEach(() => {
    vi.mock("sonner", () => ({
      toast: {
        error: vi.fn(),
        success: vi.fn(),
      },
    }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    it("should return ok on successful login", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValue({ ok: true });
      const result = await authService.login({ email: "test@test.com", password: "password" });
      expect(result).toEqual({ ok: true });
      expect(fetch).toHaveBeenCalledWith("/api/auth/login", expect.any(Object));
    });

    it("should return error on failed login", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Invalid credentials" }),
      });
      const result = await authService.login({ email: "test@test.com", password: "password" });
      expect(result).toEqual({ ok: false, error: "Invalid credentials" });
    });
  });

  describe("register", () => {
    it("should return ok on successful registration", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValue({ ok: true });
      const result = await authService.register({
        email: "test@test.com",
        password: "password",
        confirmPassword: "password",
      });
      expect(result).toEqual({ ok: true });
      expect(fetch).toHaveBeenCalledWith("/api/auth/register", expect.any(Object));
    });

    it("should return error on failed registration", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Email already in use" }),
      });
      const result = await authService.register({
        email: "test@test.com",
        password: "password",
        confirmPassword: "password",
      });
      expect(result).toEqual({ ok: false, error: "Email already in use" });
    });
  });

  describe("requestPasswordReset", () => {
    it("should make a POST request and not throw", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValue({ ok: true });
      await expect(authService.requestPasswordReset({ email: "test@test.com" })).resolves.not.toThrow();
      expect(fetch).toHaveBeenCalledWith("/api/auth/password-reset", expect.any(Object));
    });
  });

  describe("updatePassword", () => {
    it("should return success on successful password update", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValue({ ok: true });
      const result = await authService.updatePassword({ password: "newpassword", confirmPassword: "newpassword" });
      expect(result).toEqual({ status: "success" });
      expect(fetch).toHaveBeenCalledWith("/api/auth/update-password", expect.any(Object));
    });

    it("should return unauthorized on 401 error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValue({ ok: false, status: 401 });
      const result = await authService.updatePassword({ password: "newpassword", confirmPassword: "newpassword" });
      expect(result).toEqual({ status: "unauthorized" });
    });

    it("should return error on other failures", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      });
      const result = await authService.updatePassword({ password: "newpassword", confirmPassword: "newpassword" });
      expect(result).toEqual({ status: "error", error: "Server error" });
    });
  });
});
