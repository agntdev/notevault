import { NoteCard } from "../components/NoteCard";
import { NoteForm } from "../components/NoteForm";
import { useNotesLoader } from "../hooks/useNotesLoader";
import { useNotesStore } from "../store/notesStore";

export function NotesPage() {
  const { notes, upsertNote, removeNote, loading, error } = useNotesStore();
  const { reload } = useNotesLoader();

  return (
    <section className="nv-notes-page">
      <NoteForm onCreated={upsertNote} />

      <div className="nv-notes-list" aria-live="polite">
        <h3>Your notes ({notes.length})</h3>

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
        ) : (
          <ul className="nv-notes-ul">
            {notes.map((n) => (
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
