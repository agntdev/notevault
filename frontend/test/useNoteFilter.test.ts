import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

import { useNoteFilter } from "../src/hooks/useNoteFilter";
import type { Note } from "../src/types";

const make = (id: string, title: string): Note => ({
  id,
  userId: "u",
  title,
  body: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const NOTES: Note[] = [
  make("1", "Shopping list"),
  make("2", "Project ideas"),
  make("3", "Weekend plans"),
  make("4", "shopping cart abandonment notes"),
];

describe("useNoteFilter", () => {
  it("returns every note for an empty query", () => {
    const { result } = renderHook(() => useNoteFilter(NOTES, ""));
    expect(result.current).toHaveLength(NOTES.length);
  });

  it("returns every note for a whitespace-only query", () => {
    const { result } = renderHook(() => useNoteFilter(NOTES, "   "));
    expect(result.current).toHaveLength(NOTES.length);
  });

  it("matches case-insensitively on title substring", () => {
    const { result } = renderHook(() => useNoteFilter(NOTES, "shop"));
    expect(result.current.map((n) => n.id).sort()).toEqual(["1", "4"]);
  });

  it("treats regex meta characters as literals", () => {
    // Without escaping, "(" would crash with `SyntaxError: Invalid regex`.
    const { result } = renderHook(() => useNoteFilter(NOTES, "(unclosed"));
    expect(result.current).toEqual([]);
  });
});
