import { z, ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";

type ValidationTarget = "body" | "params" | "query";

/**
 * Express middleware factory for Zod validation
 * Validates request body, params, or query against a Zod schema
 */
export function validate<T extends z.ZodType>(
  schema: T,
  target: ValidationTarget = "body"
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the data to validate based on target
      const dataToValidate = req[target];

      // Parse and validate with Zod
      const validated = await schema.parseAsync(dataToValidate);

      // Replace the original data with validated (and potentially transformed) data
      // Use Object.assign to avoid readonly property errors
      Object.assign(req[target], validated);

      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly response
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          error: "Validation failed",
          details: formattedErrors
        });
      }

      // Handle unexpected errors
      console.error("Validation middleware error:", error);
      console.error("Error details:", {
        type: typeof error,
        message: error instanceof Error ? error.message : "Unknown",
        stack: error instanceof Error ? error.stack : "No stack trace"
      });
      return res.status(500).json({
        error: "Internal server error during validation",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
}

/**
 * Convenience wrappers for common validation targets
 */
export const validateBody = <T extends z.ZodType>(schema: T) =>
  validate(schema, "body");

export const validateParams = <T extends z.ZodType>(schema: T) =>
  validate(schema, "params");

export const validateQuery = <T extends z.ZodType>(schema: T) =>
  validate(schema, "query");
