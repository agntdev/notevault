import { NoteCard } from "../components/NoteCard";
import { NoteForm } from "../components/NoteForm";
import { useNotesStore } from "../store/notesStore";

export function NotesPage() {
  const { notes, upsertNote, removeNote, error } = useNotesStore();

  return (
    <section className="nv-notes-page">
      <NoteForm onCreated={upsertNote} />

      <div className="nv-notes-list" aria-live="polite">
        <h3>Your notes ({notes.length})</h3>
        {error && (
          <p className="nv-err" role="alert">
            {error}
          </p>
        )}
        {notes.length === 0 ? (
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
