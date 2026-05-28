import { apiFetch } from "./client";
import type { User } from "../types";

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: (creds: Credentials) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(creds),
    }),
  register: (creds: Credentials) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(creds),
    }),
};
