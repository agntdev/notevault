import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmDialog } from "../src/components/ConfirmDialog";

describe("<ConfirmDialog />", () => {
  function setup(open = true) {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const view = render(
      <ConfirmDialog
        open={open}
        title="Delete?"
        message="Sure?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
        destructive
      />,
    );
    return { ...view, onConfirm, onCancel };
  }

  it("renders nothing when open is false", () => {
    setup(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders, focuses confirm, and Esc cancels", async () => {
    const { onConfirm, onCancel } = setup();
    const confirm = screen.getByRole("button", { name: "Delete" });
    expect(confirm).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("clicking confirm fires onConfirm", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("clicking the backdrop cancels", async () => {
    const user = userEvent.setup();
    const { onCancel } = setup();
    // The dialog content stops propagation; clicking outside (the backdrop)
    // is what triggers onCancel.
    await user.click(screen.getByRole("presentation"));
    expect(onCancel).toHaveBeenCalled();
  });
});
