import { NoteForm } from "../components/NoteForm";
import { useNotesStore } from "../store/notesStore";

export function NotesPage() {
  const { notes, upsertNote, error } = useNotesStore();

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
              <li key={n.id} className="nv-note-card">
                <h4>{n.title}</h4>
                {n.body && <p>{n.body}</p>}
                <span className="nv-muted nv-note-meta">
                  Updated {new Date(n.updatedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
