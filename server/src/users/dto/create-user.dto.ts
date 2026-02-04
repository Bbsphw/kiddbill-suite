// server/src/users/dto/create-user.dto.ts

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Schema สำหรับข้อมูลที่ส่งมาจาก Clerk (Frontend หรือ Webhook)
export const CreateUserSchema = z.object({
  id: z.string().min(1), // User ID จาก Clerk (user_xxxx)
  email: z.string().email().optional().nullable(), // บางที Clerk ส่งมาเป็น null ได้ถ้าสมัครด้วยเบอร์
  username: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
