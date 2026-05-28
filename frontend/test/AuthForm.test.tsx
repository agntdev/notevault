import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthForm } from "../src/components/AuthForm";
import { useAuthStore } from "../src/store/authStore";

const login = vi.fn();
const register = vi.fn();
vi.mock("../src/api/auth", () => ({
  authApi: {
    login: (c: unknown) => login(c),
    register: (c: unknown) => register(c),
  },
}));

beforeEach(() => {
  login.mockReset();
  register.mockReset();
  useAuthStore.setState({ user: null, token: null });
});

describe("<AuthForm />", () => {
  it("rejects bad email + short password before hitting the API", async () => {
    const user = userEvent.setup();
    const { container } = render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "1234");
    // HTML5 native validation would otherwise eat the submit before the
    // component's own validator runs; fire the form submit directly to
    // exercise the JS-side validation path.
    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    expect(login).not.toHaveBeenCalled();
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("calls authApi.login and hydrates the auth store on success", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    login.mockResolvedValue({
      user: { id: "u1", email: "a@b.com" },
      token: "tok",
    });

    render(<AuthForm mode="login" onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(login).toHaveBeenCalledWith({ email: "a@b.com", password: "password123" });
    // Wait for the async submit to finish before reading the store.
    await screen.findByRole("button", { name: /sign in/i });
    expect(useAuthStore.getState().user).toEqual({ id: "u1", email: "a@b.com" });
    expect(useAuthStore.getState().token).toBe("tok");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("calls authApi.register in register mode", async () => {
    const user = userEvent.setup();
    register.mockResolvedValue({
      user: { id: "u2", email: "new@b.com" },
      token: "tok2",
    });

    render(<AuthForm mode="register" />);
    await user.type(screen.getByLabelText(/email/i), "new@b.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(register).toHaveBeenCalledTimes(1);
    expect(login).not.toHaveBeenCalled();
  });

  it("shows the server's error message on 401 / 409", async () => {
    const user = userEvent.setup();
    const { ApiClientError } = await import("../src/api/client");
    login.mockRejectedValue(new ApiClientError("Invalid credentials", 401));

    render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });
});
