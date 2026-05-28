import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { HttpError } from "../errors.js";
import { logger } from "../logger.js";

/**
 * Last-resort handler: normalises Zod errors into 400/details, our own
 * HttpError into its status, and anything else into 500 (without leaking
 * stack traces to the client).
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // Required by Express to recognise this as an error handler.
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      // Keep the first error per field; further ones are usually consequences.
      if (!details[key]) details[key] = issue.message;
    }
    res.status(400).json({ error: "Validation failed", details });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  logger().error({ err, path: req.path, method: req.method }, "unhandled error");
  res.status(500).json({ error: "Internal server error" });
}

/** Async wrapper so route handlers can `throw` instead of `next(err)`. */
export function asyncHandler<T extends (req: Request, res: Response) => Promise<unknown>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}
