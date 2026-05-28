import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NoteForm } from "../src/components/NoteForm";

const create = vi.fn();
vi.mock("../src/api/notes", () => ({
  notesApi: {
    create: (input: unknown) => create(input),
  },
}));

beforeEach(() => {
  create.mockReset();
});

describe("<NoteForm />", () => {
  it("disables Add note until a title is entered", () => {
    render(<NoteForm />);
    const btn = screen.getByRole("button", { name: /add note/i });
    expect(btn).toBeDisabled();
  });

  it("submits trimmed title + body and clears the inputs on success", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    create.mockResolvedValue({
      id: "n1",
      userId: "u1",
      title: "Hi",
      body: "there",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<NoteForm onCreated={onCreated} />);
    await user.type(screen.getByLabelText(/title/i), "  Hi  ");
    await user.type(screen.getByLabelText(/body/i), "there");
    await user.click(screen.getByRole("button", { name: /add note/i }));

    expect(create).toHaveBeenCalledWith({ title: "Hi", body: "there" });
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText(/title/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/body/i) as HTMLTextAreaElement).value).toBe("");
  });

  it("surfaces server validation errors inline", async () => {
    const user = userEvent.setup();
    const { ApiClientError } = await import("../src/api/client");
    create.mockRejectedValue(new ApiClientError("Validation failed", 400, { title: "Too short" }));

    render(<NoteForm />);
    await user.type(screen.getByLabelText(/title/i), "x");
    await user.click(screen.getByRole("button", { name: /add note/i }));

    expect(await screen.findByText("Too short")).toBeInTheDocument();
  });
});
