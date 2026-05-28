import jwt from "jsonwebtoken";

import { loadConfig } from "../config.js";

export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Sign a JWT for the given user. The secret + expiry come from env. Used
 * by the register and login handlers in `routes/auth.ts`.
 */
export function signToken(payload: JwtPayload): string {
  const cfg = loadConfig();
  return jwt.sign(payload, cfg.JWT_SECRET, {
    expiresIn: cfg.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    issuer: "notevault",
  });
}
