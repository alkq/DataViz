import { z, ZodSchema } from 'zod';

export function validateWithZod<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Validation failed: ${errors}`);
  }
  return result.data;
}