// server/src/bank-accounts/dto/create-bank-account.dto.ts

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'), // e.g. KBANK, SCB, PROMPTPAY
  accountNumber: z.string().min(1, 'Account number is required'),
  accountName: z.string().min(1, 'Account name is required'),
  isDefault: z.boolean().default(false),
});

export class CreateBankAccountDto extends createZodDto(
  CreateBankAccountSchema,
) {}
