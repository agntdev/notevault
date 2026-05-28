import { useState, type FormEvent } from "react";

import { ApiClientError } from "../api/client";
import { authApi, type Credentials } from "../api/auth";
import { useAuthStore } from "../store/authStore";

interface FieldErrors {
  email?: string;
  password?: string;
  form?: string;
}

interface AuthFormProps {
  mode: "login" | "register";
  /** Called after `setSession` succeeds — usually a navigate("/notes"). */
  onSuccess?: () => void;
}

/**
 * Shared login/register form. Behaviour is parameterised by `mode`:
 *
 *   - "login":    POST /api/auth/login;   server returns the existing user + JWT
 *   - "register": POST /api/auth/register; server creates the user + returns JWT
 *
 * On success the auth store is hydrated (persisted to localStorage by the
 * zustand `persist` middleware in T01) and the caller is notified via
 * `onSuccess`. 400 validation errors map onto inline field errors; 401
 * "Invalid credentials" or 409 "Email already registered" surfaces as a
 * form-level alert.
 */
export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(creds: Credentials): FieldErrors {
    const next: FieldErrors = {};
    if (!creds.email.trim()) next.email = "Email is required.";
    else if (!/.+@.+\..+/.test(creds.email)) next.email = "Enter a valid email address.";
    if (!creds.password) next.password = "Password is required.";
    else if (creds.password.length < 8)
      next.password = "Password must be at least 8 characters.";
    return next;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const creds = { email: email.trim(), password };
    const v = validate(creds);
    if (v.email || v.password) {
      setErrors(v);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { user, token } = mode === "login" ? await authApi.login(creds) : await authApi.register(creds);
      setSession(user, token);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 400 && err.details) {
          setErrors(err.details as FieldErrors);
        } else {
          setErrors({ form: err.message });
        }
      } else {
        setErrors({ form: err instanceof Error ? err.message : "Something went wrong." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const submitLabel = mode === "login" ? "Sign in" : "Create account";

  return (
    <form className="nv-card nv-form" onSubmit={handleSubmit} aria-label={submitLabel}>
      <h2>{mode === "login" ? "Sign in" : "Create an account"}</h2>

      <label className="nv-field">
        <span>Email</span>
        <input
          type="email"
          className="nv-input"
          value={email}
          autoComplete={mode === "login" ? "username" : "email"}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "auth-email-err" : undefined}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {errors.email && (
          <span id="auth-email-err" className="nv-err">
            {errors.email}
          </span>
        )}
      </label>

      <label className="nv-field">
        <span>Password</span>
        <input
          type="password"
          className="nv-input"
          value={password}
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "auth-password-err" : undefined}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {errors.password && (
          <span id="auth-password-err" className="nv-err">
            {errors.password}
          </span>
        )}
      </label>

      {errors.form && (
        <p className="nv-err" role="alert">
          {errors.form}
        </p>
      )}

      <div className="nv-form-actions">
        <button
          type="submit"
          className="nv-btn nv-btn-primary"
          disabled={submitting}
        >
          {submitting ? "Working…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
