import { Router } from "express";
import { z } from "zod";

import { hashPassword, verifyPassword } from "../auth/passwords.js";
import { signToken } from "../auth/tokens.js";
import { Conflict, Unauthorized } from "../errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { toPublicUser, usersRepo } from "../repos/usersRepo.js";

const CredentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(72),
});

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password } = CredentialsSchema.parse(req.body);
    const existing = await usersRepo.findByEmail(email);
    if (existing) throw Conflict("Email already registered");

    const passwordHash = await hashPassword(password);
    const user = await usersRepo.create(email, passwordHash);
    const token = signToken({ sub: user.id, email: user.email });
    res.status(201).json({ user: toPublicUser(user), token });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = CredentialsSchema.parse(req.body);
    const user = await usersRepo.findByEmail(email);
    if (!user) throw Unauthorized("Invalid credentials");

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) throw Unauthorized("Invalid credentials");

    const token = signToken({ sub: user.id, email: user.email });
    res.json({ user: toPublicUser(user), token });
  }),
);
