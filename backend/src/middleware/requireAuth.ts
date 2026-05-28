import type { NextFunction, Request, Response } from "express";

import { Unauthorized } from "../errors.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; email: string };
  }
}

/**
 * Stub auth guard.
 *
 * T05 ("Add authentication middleware") implements JWT verification,
 * populates `req.user` from the validated token's `sub`/`email`, and
 * rejects unauthenticated requests with 401.
 *
 * For now this guard simply rejects every request — that way the routes
 * are wired with the protection seam in place, the surface contract is
 * 100% the same as it will be after T05, and we never serve user data
 * without authentication.
 */
export function requireAuth(_req: Request, _res: Response, next: NextFunction): void {
  next(Unauthorized("Authentication required — auth middleware lands in T05"));
}
