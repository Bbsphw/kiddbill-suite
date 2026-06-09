// server/src/bank-accounts/dto/update-bank-account.dto.ts

import { createZodDto, ZodDto } from 'nestjs-zod';
import { CreateBankAccountSchema } from './create-bank-account.dto';

// ใช้ Schema เดิมแต่ทำให้ทุก field เป็น Optional
export const UpdateBankAccountSchema = CreateBankAccountSchema.partial();

export class UpdateBankAccountDto extends createZodDto(
  UpdateBankAccountSchema,
) {}

// Acknowledge ZodDto to the TypeScript compiler to ensure portable declaration generation
export type UpdateBankAccountDtoType = ZodDto<typeof UpdateBankAccountSchema>;
