import { useState, type FormEvent } from "react";

import { ApiClientError } from "../api/client";
import { notesApi } from "../api/notes";
import type { Note } from "../types";

import { ConfirmDialog } from "./ConfirmDialog";

const MAX_TITLE = 200;
const MAX_BODY = 50_000;

interface NoteCardProps {
  note: Note;
  onUpdated: (note: Note) => void;
  onDeleted: (id: string) => void;
}

/**
 * Renders one note with inline edit mode and a delete-with-confirmation
 * flow. Edit + delete only touch the API client (notesApi.update / remove)
 * — store updates are handled by the parent through callbacks so the
 * caller keeps full control of optimistic updates.
 */
export function NoteCard({ note, onUpdated, onDeleted }: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setTitle(note.title);
    setBody(note.body);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title is required.");
      return;
    }
    if (trimmed.length > MAX_TITLE) {
      setError(`Title must be at most ${MAX_TITLE} characters.`);
      return;
    }
    if (body.length > MAX_BODY) {
      setError(`Body must be at most ${MAX_BODY} characters.`);
      return;
    }
    if (trimmed === note.title && body === note.body) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await notesApi.update(note.id, { title: trimmed, body });
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : "Failed to save changes.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await notesApi.remove(note.id);
      onDeleted(note.id);
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : "Failed to delete note.";
      setError(msg);
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <li className="nv-note-card nv-note-card-editing">
        <form className="nv-form" onSubmit={handleSave} aria-label={`Edit ${note.title}`}>
          <label className="nv-field">
            <span>Title</span>
            <input
              type="text"
              className="nv-input"
              value={title}
              maxLength={MAX_TITLE}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </label>
          <label className="nv-field">
            <span>Body</span>
            <textarea
              className="nv-input nv-textarea"
              value={body}
              rows={6}
              maxLength={MAX_BODY}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          {error && (
            <p className="nv-err" role="alert">
              {error}
            </p>
          )}
          <div className="nv-form-actions">
            <button type="button" className="nv-btn" onClick={cancelEditing} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="nv-btn nv-btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="nv-note-card">
      <h4>{note.title}</h4>
      {note.body && <p>{note.body}</p>}
      <div className="nv-note-meta-row">
        <span className="nv-muted nv-note-meta">
          Updated {new Date(note.updatedAt).toLocaleString()}
        </span>
        <div className="nv-note-actions">
          <button type="button" className="nv-btn nv-btn-sm" onClick={startEditing}>
            Edit
          </button>
          <button
            type="button"
            className="nv-btn nv-btn-sm nv-btn-danger-outline"
            onClick={() => setConfirming(true)}
            disabled={deleting}
          >
            Delete
          </button>
        </div>
      </div>
      {error && !confirming && (
        <p className="nv-err" role="alert">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={confirming}
        title="Delete note?"
        message={`"${note.title}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </li>
  );
}
