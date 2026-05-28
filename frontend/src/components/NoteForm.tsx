import { useState, type FormEvent } from "react";

import { ApiClientError } from "../api/client";
import { notesApi, type CreateNoteInput } from "../api/notes";
import type { Note } from "../types";

const MAX_TITLE = 200;
const MAX_BODY = 50_000;

interface FieldErrors {
  title?: string;
  body?: string;
  form?: string;
}

interface NoteFormProps {
  /** Called with the new note after the API confirms creation. */
  onCreated?: (note: Note) => void;
}

/**
 * Validates locally before submit, then POSTs to the backend via `notesApi`.
 * Server-side validation errors come back as 400 with `details` and are
 * surfaced inline next to the offending field; everything else is shown as
 * a form-level error.
 */
export function NoteForm({ onCreated }: NoteFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(input: CreateNoteInput): FieldErrors {
    const next: FieldErrors = {};
    const trimmedTitle = input.title.trim();
    if (!trimmedTitle) next.title = "Title is required.";
    else if (trimmedTitle.length > MAX_TITLE)
      next.title = `Title must be at most ${MAX_TITLE} characters.`;
    if (input.body.length > MAX_BODY)
      next.body = `Body must be at most ${MAX_BODY} characters.`;
    return next;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const input = { title: title.trim(), body };
    const v = validate(input);
    if (v.title || v.body) {
      setErrors(v);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const note = await notesApi.create(input);
      setTitle("");
      setBody("");
      if (onCreated) onCreated(note);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 400 && err.details) {
        setErrors(err.details as FieldErrors);
      } else {
        const msg = err instanceof Error ? err.message : "Failed to create note.";
        setErrors({ form: msg });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="nv-card nv-form" onSubmit={handleSubmit} aria-label="Create note">
      <h3>New note</h3>
      <label className="nv-field">
        <span>Title</span>
        <input
          type="text"
          className="nv-input"
          value={title}
          maxLength={MAX_TITLE}
          placeholder="Give it a memorable name"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "note-title-err" : undefined}
          onChange={(e) => setTitle(e.target.value)}
        />
        {errors.title && (
          <span id="note-title-err" className="nv-err">
            {errors.title}
          </span>
        )}
      </label>

      <label className="nv-field">
        <span>Body</span>
        <textarea
          className="nv-input nv-textarea"
          value={body}
          rows={6}
          maxLength={MAX_BODY}
          placeholder="Write your thoughts…"
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? "note-body-err" : undefined}
          onChange={(e) => setBody(e.target.value)}
        />
        <span className="nv-counter">
          {body.length}/{MAX_BODY}
        </span>
        {errors.body && (
          <span id="note-body-err" className="nv-err">
            {errors.body}
          </span>
        )}
      </label>

      {errors.form && (
        <p className="nv-err" role="alert">
          {errors.form}
        </p>
      )}

      <div className="nv-form-actions">
        <button
          type="submit"
          className="nv-btn nv-btn-primary"
          disabled={submitting || title.trim() === ""}
        >
          {submitting ? "Saving…" : "Add note"}
        </button>
      </div>
    </form>
  );
}
