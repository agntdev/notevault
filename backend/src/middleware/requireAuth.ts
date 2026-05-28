import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { loadConfig } from "../config.js";
import { Unauthorized } from "../errors.js";
import { logger } from "../logger.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; email: string };
  }
}

interface TokenClaims {
  sub: string;
  email?: string;
  iss?: string;
  exp?: number;
  iat?: number;
}

/**
 * Pulls the bearer token from the `Authorization` header. Returns null when
 * no header is present — the caller decides whether that's a 401.
 */
function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(/\s+/, 2);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !value) return null;
  return value;
}

/**
 * JWT verification middleware. Protects every endpoint mounted under the
 * notes router (and any future authenticated route) by:
 *
 *   1. Reading the bearer token from `Authorization: Bearer <token>`.
 *   2. Verifying the signature against `JWT_SECRET` and the `notevault`
 *      issuer claim (set by `auth/tokens.ts → signToken`).
 *   3. Letting jsonwebtoken enforce the `exp` claim — expired tokens raise
 *      `TokenExpiredError` which we surface as 401 "Token expired".
 *   4. Populating `req.user` from `sub` / `email` so downstream handlers
 *      don't have to re-parse the token.
 *
 * Failures never leak the underlying jwt error message to the client.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req.headers.authorization);
  if (!token) {
    next(Unauthorized("Authentication required"));
    return;
  }

  const cfg = loadConfig();
  try {
    const decoded = jwt.verify(token, cfg.JWT_SECRET, {
      issuer: "notevault",
      // Small clock skew tolerance — clients and servers can drift a few
      // seconds without us treating a fresh token as expired.
      clockTolerance: 5,
    }) as TokenClaims;

    if (typeof decoded.sub !== "string" || !decoded.sub) {
      next(Unauthorized("Invalid token"));
      return;
    }
    req.user = {
      id: decoded.sub,
      email: typeof decoded.email === "string" ? decoded.email : "",
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(Unauthorized("Token expired"));
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      // Don't echo the specific jwt error back to the client — it can hint
      // at the secret length / algorithm in some cases.
      logger().debug({ err: err.message }, "auth: jwt verification failed");
      next(Unauthorized("Invalid token"));
      return;
    }
    next(err);
  }
}
