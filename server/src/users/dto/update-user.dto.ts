// server/src/users/dto/update-user.dto.ts

import { createZodDto, ZodDto } from 'nestjs-zod';
import { CreateUserSchema } from './create-user.dto';

// ตัด id ทิ้ง (ห้ามแก้ ID) และทำให้ทุกอย่างเป็น Optional
export const UpdateUserSchema = CreateUserSchema.omit({ id: true }).partial();

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

// Acknowledge ZodDto to the TypeScript compiler to ensure portable declaration generation
export type UpdateUserDtoType = ZodDto<typeof UpdateUserSchema>;
