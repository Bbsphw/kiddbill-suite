// server/src/bank-accounts/dto/update-bank-account.dto.ts

import { createZodDto } from 'nestjs-zod';
import { CreateBankAccountSchema } from './create-bank-account.dto';

// ใช้ Schema เดิมแต่ทำให้ทุก field เป็น Optional
const UpdateBankAccountSchema = CreateBankAccountSchema.partial();

export class UpdateBankAccountDto extends createZodDto(
  UpdateBankAccountSchema,
) {}
