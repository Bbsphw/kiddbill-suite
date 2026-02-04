// server/src/users/dto/update-user.dto.ts

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  // Email เราจะไม่ให้แก้ที่นี่ (ควรแก้ที่ Clerk แล้ว Sync ลงมา)
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
