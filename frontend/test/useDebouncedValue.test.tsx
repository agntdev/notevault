import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useDebouncedValue } from "../src/hooks/useDebouncedValue";

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 100));
    expect(result.current).toBe("a");
  });

  it("delays updates by the given ms", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 200), {
      initialProps: { v: "a" },
    });

    rerender({ v: "b" });
    expect(result.current).toBe("a"); // not yet updated

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("b");
  });

  it("collapses rapid updates into a single trailing settle", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 100), {
      initialProps: { v: "a" },
    });

    rerender({ v: "b" });
    act(() => {
      vi.advanceTimersByTime(60);
    });
    rerender({ v: "c" });
    act(() => {
      vi.advanceTimersByTime(60);
    });
    // Still in window after the second change.
    expect(result.current).toBe("a");
    act(() => {
      vi.advanceTimersByTime(40);
    });
    expect(result.current).toBe("c");
  });
});
