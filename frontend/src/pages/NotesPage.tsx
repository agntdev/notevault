import { NoteCard } from "../components/NoteCard";
import { NoteForm } from "../components/NoteForm";
import { SearchBar } from "../components/SearchBar";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useNoteFilter } from "../hooks/useNoteFilter";
import { useNotesLoader } from "../hooks/useNotesLoader";
import { useNotesStore } from "../store/notesStore";

const SEARCH_DEBOUNCE_MS = 150;

export function NotesPage() {
  const { notes, upsertNote, removeNote, searchQuery, setSearchQuery, loading, error } =
    useNotesStore();
  const { reload } = useNotesLoader();

  // Debounce the value used for filtering — the input stays in sync with
  // every keystroke for responsiveness, but the (memoised) regex filter
  // only runs after the user pauses briefly.
  const debouncedQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const filtered = useNoteFilter(notes, debouncedQuery);

  return (
    <section className="nv-notes-page">
      <NoteForm onCreated={upsertNote} />

      <div className="nv-notes-list" aria-live="polite">
        <div className="nv-notes-header">
          <h3>Your notes ({notes.length})</h3>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {error && (
          <div className="nv-err-row" role="alert">
            <p className="nv-err">{error}</p>
            <button type="button" className="nv-btn nv-btn-sm" onClick={() => void reload()}>
              Retry
            </button>
          </div>
        )}

        {loading && notes.length === 0 ? (
          <p className="nv-muted">Loading your notes…</p>
        ) : notes.length === 0 && !error ? (
          <p className="nv-muted">
            No notes yet. Use the form above to create your first one.
          </p>
        ) : filtered.length === 0 ? (
          <p className="nv-muted">
            No notes match <strong>"{debouncedQuery}"</strong>.
          </p>
        ) : (
          <ul className="nv-notes-ul">
            {filtered.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onUpdated={upsertNote}
                onDeleted={removeNote}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
