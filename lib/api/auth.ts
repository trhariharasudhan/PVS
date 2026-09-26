import { apiClient } from "./client";
import { AuthResponse, UserPublic } from "@/types";

/**
 * Authenticate staff credentials. Sets HttpOnly session cookie on the browser.
 */
export async function loginStaff(email: string, password: string): Promise<AuthResponse> {
  return apiClient<AuthResponse>("auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Invalidate staff session and clear the HttpOnly cookie.
 */
export async function logoutStaff(): Promise<{ message: string }> {
  return apiClient<{ message: string }>("auth/logout", {
    method: "POST",
  });
}

/**
 * Fetch the currently authenticated staff profile from the active session.
 */
export async function getCurrentStaff(): Promise<UserPublic> {
  return apiClient<UserPublic>("auth/me");
}
