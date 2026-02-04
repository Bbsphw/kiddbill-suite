// server/src/friends/dto/create-friend.dto.ts

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateFriendSchema = z.object({
  // trim() ตัดช่องว่างหน้าหลังกัน User เผลอเคาะ spacebar
  nickname: z.string().trim().min(1, 'Nickname is required'),
});

export class CreateFriendDto extends createZodDto(CreateFriendSchema) {}
