import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SearchBar } from "../src/components/SearchBar";

describe("<SearchBar />", () => {
  it("renders a searchbox with the current value", () => {
    render(<SearchBar value="hello" onChange={() => {}} />);
    expect(screen.getByRole("searchbox")).toHaveValue("hello");
  });

  it("fires onChange on input", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onChange={onChange} />);
    await user.type(screen.getByRole("searchbox"), "ab");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, "a");
    expect(onChange).toHaveBeenNthCalledWith(2, "b");
  });

  it("shows the clear button only when value is non-empty", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchBar value="" onChange={onChange} />);
    expect(screen.queryByLabelText(/clear search/i)).toBeNull();

    rerender(<SearchBar value="hello" onChange={onChange} />);
    const clear = screen.getByLabelText(/clear search/i);
    expect(clear).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(clear);
    expect(onChange).toHaveBeenLastCalledWith("");
  });
});
