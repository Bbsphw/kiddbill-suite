// server/src/bill-members/dto/join-bill-member.dto.ts

import { createZodDto, ZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const JoinBillSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .toUpperCase()
    .length(6, 'Join code must be 6 characters'),
});

export class JoinBillDto extends createZodDto(JoinBillSchema) {}

// Acknowledge ZodDto to the TypeScript compiler to ensure portable declaration generation
export type JoinBillDtoType = ZodDto<typeof JoinBillSchema>;
