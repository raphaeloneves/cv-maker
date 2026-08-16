/** Uniform application error, converted by the global error handler in
 * server.ts into the API's canonical error shape:
 * `{ error: { code, message, fields? } }` (see docs/api-routes.md). */
export class AppError extends Error {
  statusCode: number;
  code: string;
  fields?: Record<string, string>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}

export const notFound = (message = "Not found") => new AppError(404, "NOT_FOUND", message);
export const forbidden = (message = "Forbidden") => new AppError(403, "FORBIDDEN", message);
export const unauthorized = (message = "Unauthorized") =>
  new AppError(401, "UNAUTHORIZED", message);
export const conflict = (message: string, fields?: Record<string, string>) =>
  new AppError(409, "CONFLICT", message, fields);
export const badRequest = (message: string, fields?: Record<string, string>) =>
  new AppError(400, "BAD_REQUEST", message, fields);
