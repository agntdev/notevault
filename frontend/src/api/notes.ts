import { apiFetch } from "./client";
import type { Note } from "../types";

export interface CreateNoteInput {
  title: string;
  body: string;
}

export interface UpdateNoteInput {
  title?: string;
  body?: string;
}

export const notesApi = {
  list: () => apiFetch<Note[]>("/notes"),
  create: (input: CreateNoteInput) =>
    apiFetch<Note>("/notes", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: UpdateNoteInput) =>
    apiFetch<Note>(`/notes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiFetch<{ ok: true }>(`/notes/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
