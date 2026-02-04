// server/src/friends/dto/update-friend.dto.ts

import { createZodDto } from 'nestjs-zod';
import { CreateFriendSchema } from './create-friend.dto';

const UpdateFriendSchema = CreateFriendSchema.partial();

export class UpdateFriendDto extends createZodDto(UpdateFriendSchema) {}
