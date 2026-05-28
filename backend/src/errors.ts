/**
 * Domain-level errors that the HTTP layer translates into status codes.
 * Anything else falls through to a 500.
 */

export class HttpError extends Error {
  status: number;
  details?: Record<string, string>;
  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export const ValidationError = (details: Record<string, string>) =>
  new HttpError(400, "Validation failed", details);

export const Unauthorized = (message = "Authentication required") =>
  new HttpError(401, message);

export const Forbidden = (message = "Forbidden") => new HttpError(403, message);

export const NotFound = (message = "Not found") => new HttpError(404, message);

export const Conflict = (message: string) => new HttpError(409, message);
