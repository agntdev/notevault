import { useMemo } from "react";

import type { Note } from "../types";

/** Match anything in the regex chars below with a literal char. */
const REGEX_META = /[.*+?^${}()|[\]\\]/g;

function escapeRegex(input: string): string {
  return input.replace(REGEX_META, "\\$&");
}

/**
 * Filter notes by title using case-insensitive regex matching.
 *
 * - The query is escaped so user-typed `.` or `+` matches literally.
 *   Without this, an unbalanced bracket would crash the page.
 * - An empty / whitespace-only query returns the input untouched so the
 *   caller doesn't have to special-case it.
 * - Memoised on `notes` + `query` so re-renders don't re-filter.
 */
export function useNoteFilter(notes: ReadonlyArray<Note>, query: string): Note[] {
  return useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return notes.slice();
    let re: RegExp;
    try {
      re = new RegExp(escapeRegex(trimmed), "i");
    } catch {
      // Should be unreachable now that we escape, but be defensive.
      return notes.slice();
    }
    return notes.filter((n) => re.test(n.title));
  }, [notes, query]);
}
