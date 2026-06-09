// server/src/friends/dto/update-friend.dto.ts

import { createZodDto, ZodDto } from 'nestjs-zod';
import { CreateFriendSchema } from './create-friend.dto';

export const UpdateFriendSchema = CreateFriendSchema.partial();

export class UpdateFriendDto extends createZodDto(UpdateFriendSchema) {}

// Acknowledge ZodDto to the TypeScript compiler to ensure portable declaration generation
export type UpdateFriendDtoType = ZodDto<typeof UpdateFriendSchema>;
