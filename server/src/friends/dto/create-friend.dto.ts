// server/src/friends/dto/create-friend.dto.ts

import { createZodDto, ZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateFriendSchema = z.object({
  nickname: z.string().min(1, 'Nickname is required'), // ชื่อเพื่อนที่จะแสดง
});

export class CreateFriendDto extends createZodDto(CreateFriendSchema) {}

// Acknowledge ZodDto to the TypeScript compiler to ensure portable declaration generation
export type CreateFriendDtoType = ZodDto<typeof CreateFriendSchema>;
