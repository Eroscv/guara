import type { VercelResponse } from "@vercel/node";
import type { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Mesmo formato de erro do manual:
// { "error": "...", "details": { "formErrors": [], "fieldErrors": { "title": ["Required"] } } }
export function sendError(res: VercelResponse, status: number, error: string, details?: unknown) {
  res.status(status).json(details !== undefined ? { error, details } : { error });
}

export function zodDetails(err: ZodError) {
  return err.flatten();
}

export function handleCaught(res: VercelResponse, err: unknown) {
  if (err instanceof ApiError) {
    sendError(res, err.status, err.message, err.details);
    return;
  }
  // eslint-disable-next-line no-console
  console.error("[api/public/v1] erro não tratado:", err);
  sendError(res, 500, "Falha interna. Tente de novo.");
}
