import { useCallback, useEffect, useRef } from "react";

import { ApiClientError } from "../api/client";
import { notesApi } from "../api/notes";
import { useAuthStore } from "../store/authStore";
import { useNotesStore } from "../store/notesStore";

/**
 * Loads the current user's notes into the store on mount and whenever the
 * user changes. Handles the cross-cutting CRUD concerns that aren't tied to
 * a single component:
 *
 *   - 401s automatically clear the persisted session (the token is expired
 *     or the server rejected it); the protected route then bounces the
 *     user back to /login.
 *   - Other errors surface via `notesStore.setError` so the page can show a
 *     "Couldn't load notes — Retry" affordance.
 *   - A guard ref prevents the effect from firing twice under React 18
 *     StrictMode during development.
 *
 * Returns a `reload` callback the page can call after a transient failure.
 */
export function useNotesLoader(): { reload: () => Promise<void> } {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setNotes = useNotesStore((s) => s.setNotes);
  const setLoading = useNotesStore((s) => s.setLoading);
  const setError = useNotesStore((s) => s.setError);
  const inFlight = useRef(false);

  const reload = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const notes = await notesApi.list();
      setNotes(notes);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        logout();
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed to load notes.";
      setError(msg);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [logout, setError, setLoading, setNotes]);

  useEffect(() => {
    if (!user) return;
    void reload();
  }, [user, reload]);

  return { reload };
}
