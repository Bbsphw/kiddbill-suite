import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3002),

  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url().optional(),

  CLERK_SECRET_KEY: z.string().min(1).optional(),

  APP_URL: z.string().url().default('http://localhost:3002'),

  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),

  AWS_REGION: z.string().optional(),
  AWS_S3_ENDPOINT: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().optional(),

  OCR_PROVIDER: z.enum(['mock', 'document-ai', 'gemini']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      parsed.error.flatten().fieldErrors,
    );
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
