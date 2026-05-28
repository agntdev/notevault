import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";

import { Unauthorized, NotFound } from "../errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { notesRepo, toPublicNote } from "../repos/notesRepo.js";

const TitleSchema = z.string().trim().min(1).max(200);
const BodySchema = z.string().max(50_000);

const CreateSchema = z.object({
  title: TitleSchema,
  body: BodySchema.optional().default(""),
});

const UpdateSchema = z
  .object({
    title: TitleSchema.optional(),
    body: BodySchema.optional(),
  })
  .refine((v) => v.title !== undefined || v.body !== undefined, {
    message: "At least one of `title` or `body` must be provided",
  });

const ListQuerySchema = z.object({
  search: z.string().optional(),
});

export const notesRouter = Router();

// All routes below require an authenticated user (T05 fills in the
// middleware; until then the stub rejects every request with 401).
notesRouter.use(requireAuth);

function currentUserId(req: Request): string {
  const id = req.user?.id;
  if (!id) throw Unauthorized();
  return id;
}

notesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const { search } = ListQuerySchema.parse(req.query);
    const rows = await notesRepo.listForUser(userId, { search });
    res.json(rows.map(toPublicNote));
  }),
);

notesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const { title, body } = CreateSchema.parse(req.body);
    const note = await notesRepo.create(userId, title, body);
    res.status(201).json(toPublicNote(note));
  }),
);

notesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const note = await notesRepo.findById(userId, req.params.id);
    if (!note) throw NotFound("Note not found");
    res.json(toPublicNote(note));
  }),
);

notesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const patch = UpdateSchema.parse(req.body);
    const note = await notesRepo.update(userId, req.params.id, patch);
    if (!note) throw NotFound("Note not found");
    res.json(toPublicNote(note));
  }),
);

notesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const removed = await notesRepo.remove(userId, req.params.id);
    if (!removed) throw NotFound("Note not found");
    res.json({ ok: true });
  }),
);
