// server/src/users/dto/create-user.dto.ts

import { createZodDto, ZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Schema สำหรับข้อมูลที่ส่งมาจาก Clerk (Frontend หรือ Webhook)
export const CreateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'), // Clerk User ID (เช่น user_...)
  email: z.string().email('Invalid email address').optional().nullable(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .optional()
    .nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

// Acknowledge ZodDto to the TypeScript compiler to ensure portable declaration generation
export type CreateUserDtoType = ZodDto<typeof CreateUserSchema>;
